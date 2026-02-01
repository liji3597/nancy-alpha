"""历史数据回填模块 - 批量获取历史链上交易数据"""
import asyncio
from datetime import datetime, timedelta
from typing import Optional
from web3 import Web3
from web3.providers import HTTPProvider

from ..config import get_settings
from ..db import AsyncSessionLocal, init_db, close_db
from ..models import Market
from .decoder import TradeDecoder, ORDER_FILLED_TOPIC
from .listener import TradeListener

settings = get_settings()

# Polygon 平均出块时间约 2 秒
BLOCKS_PER_DAY = 43200
BLOCKS_PER_MONTH = BLOCKS_PER_DAY * 30


class HistoryBackfill:
    """历史数据回填器"""

    def __init__(self):
        self.w3 = Web3(HTTPProvider(settings.POLYGON_RPC_URL))
        self.decoder = TradeDecoder()
        self.exchange_address = Web3.to_checksum_address(settings.CTF_EXCHANGE_ADDRESS)
        self.listener = TradeListener(AsyncSessionLocal)

    async def estimate_block_for_date(self, target_date: datetime) -> int:
        """
        估算指定日期对应的区块号

        Args:
            target_date: 目标日期

        Returns:
            估算的区块号
        """
        current_block = self.w3.eth.block_number
        current_time = datetime.utcnow()

        # 计算时间差（秒）
        time_diff = (current_time - target_date).total_seconds()

        # Polygon 平均 2 秒一个区块
        blocks_diff = int(time_diff / 2)

        estimated_block = current_block - blocks_diff

        # 确保不小于 0
        return max(estimated_block, 0)

    async def get_block_range_for_period(self, months: int = 6) -> tuple[int, int]:
        """
        获取指定月数的区块范围

        Args:
            months: 往前推的月数

        Returns:
            (起始区块, 结束区块)
        """
        end_block = self.w3.eth.block_number
        start_date = datetime.utcnow() - timedelta(days=months * 30)
        start_block = await self.estimate_block_for_date(start_date)

        return start_block, end_block

    async def backfill(
        self,
        from_block: Optional[int] = None,
        to_block: Optional[int] = None,
        months: int = 6,
        batch_size: int = 1,
        delay: float = 0.2,
    ):
        """
        执行历史数据回填

        Args:
            from_block: 起始区块（如果指定则忽略 months）
            to_block: 结束区块（默认最新）
            months: 回填月数（默认 6 个月）
            batch_size: 每批处理的区块数
            delay: 每批之间的延迟（秒），避免 RPC 限流
        """
        # 初始化数据库
        await init_db()

        # 刷新 token 映射
        await self.listener.refresh_token_map()

        if not self.listener.token_map:
            print("[WARN] No market mapping available, please sync markets first")
            return

        # 确定区块范围
        if from_block is None:
            from_block, _ = await self.get_block_range_for_period(months)

        if to_block is None:
            to_block = self.w3.eth.block_number

        total_blocks = to_block - from_block
        print(f"[*] History Backfill")
        print(f"    Block range: {from_block:,} - {to_block:,}")
        print(f"    Total blocks: {total_blocks:,}")
        print(f"    Estimated batches: {total_blocks // batch_size + 1}")
        print()

        processed_blocks = 0
        total_trades = 0
        whale_trades = 0
        current_block = from_block

        start_time = datetime.now()

        while current_block <= to_block:
            batch_end = min(current_block + batch_size - 1, to_block)

            try:
                # 获取事件日志
                logs = self.w3.eth.get_logs({
                    "address": self.exchange_address,
                    "topics": [ORDER_FILLED_TOPIC],
                    "fromBlock": current_block,
                    "toBlock": batch_end,
                })

                # 处理日志
                for log in logs:
                    try:
                        await self.listener.process_log(log)
                        total_trades += 1

                        # 检查是否是大单
                        trade_data = self.decoder.decode_order_filled(log)
                        if trade_data:
                            token_id = trade_data.get("token_id", "")
                            market_info = self.listener.token_map.get(token_id)
                            if market_info:
                                amount_usd = trade_data["price"] * trade_data["size"]
                                if amount_usd >= settings.WHALE_THRESHOLD:
                                    whale_trades += 1

                    except Exception as e:
                        pass  # 跳过处理失败的日志

                processed_blocks += (batch_end - current_block + 1)
                progress = (processed_blocks / total_blocks) * 100

                # 计算剩余时间
                elapsed = (datetime.now() - start_time).total_seconds()
                if processed_blocks > 0:
                    rate = processed_blocks / elapsed
                    remaining_blocks = total_blocks - processed_blocks
                    eta_seconds = remaining_blocks / rate if rate > 0 else 0
                    eta_str = str(timedelta(seconds=int(eta_seconds)))
                else:
                    eta_str = "calculating..."

                print(f"\r    Progress: {progress:.1f}% | Blocks: {current_block:,} - {batch_end:,} | "
                      f"Trades: {total_trades:,} | Whales: {whale_trades:,} | ETA: {eta_str}   ", end="")

            except Exception as e:
                print(f"\n    [WARN] Block {current_block} - {batch_end} failed: {e}")
                # 出错后增加延迟
                await asyncio.sleep(delay * 2)

            current_block = batch_end + 1
            await asyncio.sleep(delay)

        elapsed_total = datetime.now() - start_time
        print(f"\n\n[OK] Backfill complete!")
        print(f"    Duration: {elapsed_total}")
        print(f"    Blocks processed: {processed_blocks:,}")
        print(f"    Total trades: {total_trades:,}")
        print(f"    Whale trades: {whale_trades:,}")

        await close_db()


async def run_backfill(months: int = 6, batch_size: int = 2000):
    """运行历史数据回填（CLI 入口）"""
    backfill = HistoryBackfill()
    await backfill.backfill(months=months, batch_size=batch_size)


if __name__ == "__main__":
    import sys

    months = 6
    if len(sys.argv) > 1:
        try:
            months = int(sys.argv[1])
        except ValueError:
            pass

    print(f"Starting backfill for {months} months...")
    asyncio.run(run_backfill(months=months))
