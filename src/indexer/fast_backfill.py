"""快速回填模块 - 使用 Polymarket Data API 直接获取交易数据"""
import asyncio
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..db import AsyncSessionLocal, init_db, close_db
from ..models import Trade, Market

settings = get_settings()

# Polymarket Data API
DATA_API_URL = "https://data-api.polymarket.com"


class FastBackfill:
    """快速回填器 - 使用 Polymarket Data API"""

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.token_map: Dict[str, Dict] = {}

    async def close(self):
        await self.client.aclose()

    async def refresh_token_map(self):
        """刷新 token_id -> market 映射"""
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(Market).where(Market.active == True)
            )
            markets = result.scalars().all()

            self.token_map = {}
            for m in markets:
                self.token_map[m.yes_token_id] = {"slug": m.slug, "outcome": "YES"}
                self.token_map[m.no_token_id] = {"slug": m.slug, "outcome": "NO"}

            print(f"Loaded {len(self.token_map)} token mappings")

    async def fetch_trades(
        self,
        limit: int = 100,
        offset: int = 0,
        market_slug: Optional[str] = None,
    ) -> List[Dict]:
        """
        从 Polymarket Data API 获取交易数据

        Args:
            limit: 每次获取数量 (max 100)
            offset: 偏移量
            market_slug: 可选，筛选特定市场

        Returns:
            交易数据列表
        """
        params = {
            "limit": min(limit, 100),
            "offset": offset,
        }

        if market_slug:
            params["slug"] = market_slug

        try:
            response = await self.client.get(
                f"{DATA_API_URL}/trades",
                params=params
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            print(f"[WARN] 获取交易失败: {e}")
            return []

    async def save_trades(self, session: AsyncSession, trades: List[Dict]) -> tuple[int, int]:
        """
        保存交易到数据库

        Returns:
            (saved_count, whale_count)
        """
        saved = 0
        whales = 0

        for t in trades:
            tx_hash = t.get("transactionHash", "")
            if not tx_hash:
                continue

            # 检查是否已存在
            existing = await session.execute(
                select(Trade).where(Trade.tx_hash == tx_hash)
            )
            if existing.scalar_one_or_none():
                continue

            # 解析交易数据
            asset_id = t.get("asset", "")
            market_info = self.token_map.get(asset_id)

            # 如果 token 不在映射中，使用 API 返回的 slug
            if not market_info:
                slug = t.get("slug", "")
                outcome_str = t.get("outcome", "YES")
                market_info = {"slug": slug, "outcome": outcome_str}

            side = t.get("side", "BUY")
            price = Decimal(str(t.get("price", 0)))
            size = Decimal(str(t.get("size", 0)))
            amount_usd = price * size

            # 时间戳处理
            timestamp_val = t.get("timestamp", 0)
            if isinstance(timestamp_val, int):
                timestamp = datetime.fromtimestamp(timestamp_val)
            else:
                timestamp = datetime.utcnow()

            is_whale = amount_usd >= settings.WHALE_THRESHOLD

            trade = Trade(
                tx_hash=tx_hash,
                log_index=0,
                block_number=0,
                market_slug=market_info.get("slug", ""),
                maker=t.get("proxyWallet", ""),
                taker="",
                side=side,
                outcome=market_info.get("outcome", "YES"),
                price=price,
                size=size,
                amount_usd=amount_usd,
                is_whale=is_whale,
                timestamp=timestamp,
            )

            session.add(trade)
            saved += 1
            if is_whale:
                whales += 1

        await session.commit()
        return saved, whales

    async def backfill(
        self,
        total_trades: int = 10000,
        batch_size: int = 100,
        delay: float = 0.2,
    ):
        """
        执行快速回填

        Args:
            total_trades: 要获取的总交易数
            batch_size: 每批数量
            delay: 批次间延迟
        """
        await init_db()
        await self.refresh_token_map()

        print(f"[*] 快速回填 (Polymarket Data API)")
        print(f"    目标交易数: {total_trades:,}")
        print(f"    批次大小: {batch_size}")
        print()

        total_saved = 0
        total_whales = 0
        offset = 0
        start_time = datetime.now()

        async with AsyncSessionLocal() as session:
            while offset < total_trades:
                trades = await self.fetch_trades(limit=batch_size, offset=offset)

                if not trades:
                    print(f"\n[*] 没有更多交易数据")
                    break

                saved, whales = await self.save_trades(session, trades)
                total_saved += saved
                total_whales += whales
                offset += len(trades)

                # 进度显示
                progress = min(offset / total_trades * 100, 100)
                elapsed = (datetime.now() - start_time).total_seconds()
                rate = offset / elapsed if elapsed > 0 else 0

                print(f"\r    进度: {progress:.1f}% | "
                      f"已获取: {offset:,} | "
                      f"已保存: {total_saved:,} | "
                      f"大单: {total_whales:,} | "
                      f"速率: {rate:.1f}/s   ", end="")

                await asyncio.sleep(delay)

        elapsed_total = datetime.now() - start_time
        print(f"\n\n[OK] 回填完成!")
        print(f"    耗时: {elapsed_total}")
        print(f"    获取交易: {offset:,}")
        print(f"    保存交易: {total_saved:,}")
        print(f"    大单交易: {total_whales:,}")

        await self.close()
        await close_db()


async def run_fast_backfill(total: int = 10000):
    """运行快速回填 (CLI 入口)"""
    backfill = FastBackfill()
    await backfill.backfill(total_trades=total)


if __name__ == "__main__":
    import sys

    total = 10000
    if len(sys.argv) > 1:
        try:
            total = int(sys.argv[1])
        except ValueError:
            pass

    print(f"开始快速回填 {total} 条交易...")
    asyncio.run(run_fast_backfill(total))
