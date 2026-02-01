"""链上监听模块 - 监听 Polymarket CTF Exchange 的交易事件"""
import asyncio
from datetime import datetime
from decimal import Decimal
from typing import Dict, Optional, Callable
from web3 import Web3
from web3.providers import HTTPProvider
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..models import Trade, Market
from .decoder import TradeDecoder, ORDER_FILLED_TOPIC

settings = get_settings()


class TradeListener:
    """链上交易监听器"""

    def __init__(self, session_factory):
        """
        初始化监听器

        Args:
            session_factory: 异步数据库会话工厂
        """
        self.w3 = Web3(HTTPProvider(settings.POLYGON_RPC_URL))

        # 添加 POA middleware 支持 Polygon 链
        from web3.middleware import geth_poa_middleware
        self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)

        self.decoder = TradeDecoder()
        self.session_factory = session_factory
        self.exchange_address = Web3.to_checksum_address(settings.CTF_EXCHANGE_ADDRESS)
        self.whale_threshold = Decimal(str(settings.WHALE_THRESHOLD))
        self.running = False
        self.token_map: Dict[str, Dict] = {}  # token_id -> {slug, outcome}
        self.on_whale_callback: Optional[Callable] = None

    async def refresh_token_map(self):
        """刷新 token 到市场的映射"""
        async with self.session_factory() as session:
            result = await session.execute(
                select(Market).where(Market.active == True)
            )
            markets = result.scalars().all()

            self.token_map = {}
            for m in markets:
                self.token_map[m.yes_token_id] = {"slug": m.slug, "outcome": "YES"}
                self.token_map[m.no_token_id] = {"slug": m.slug, "outcome": "NO"}

        print(f"[OK] Loaded {len(self.token_map)} token mappings")

    def set_whale_callback(self, callback: Callable):
        """设置大单回调函数"""
        self.on_whale_callback = callback

    async def start(self, from_block: Optional[int] = None, poll_interval: int = 2):
        """
        开始监听链上交易

        Args:
            from_block: 起始区块，None 则从最新区块开始
            poll_interval: 轮询间隔（秒）
        """
        self.running = True
        await self.refresh_token_map()

        # 追赶模式配置
        CATCHUP_STEP = 10  # 追赶时每次处理的区块数（减小以避免 413 错误）
        CATCHUP_DELAY = 0.5  # 追赶时每批之间的延迟（秒）
        MAX_CATCHUP_PER_CYCLE = 100  # 每个周期最多追赶的区块数

        if from_block is None:
            from_block = self.w3.eth.block_number

        current_block = from_block
        print(f"[LISTENER] Starting from block: {current_block}")

        while self.running:
            try:
                latest_block = self.w3.eth.block_number
                blocks_behind = latest_block - current_block

                if blocks_behind > 0:
                    # 限制每个周期的追赶量
                    target_block = min(current_block + MAX_CATCHUP_PER_CYCLE, latest_block)

                    if blocks_behind > MAX_CATCHUP_PER_CYCLE:
                        print(f"[CATCHUP] Behind {blocks_behind} blocks, catching up to {target_block}")

                    # 分批处理
                    while current_block <= target_block and self.running:
                        batch_end = min(current_block + CATCHUP_STEP - 1, target_block)

                        try:
                            logs = self.w3.eth.get_logs({
                                "address": self.exchange_address,
                                "topics": [ORDER_FILLED_TOPIC],
                                "fromBlock": current_block,
                                "toBlock": batch_end,
                            })

                            if logs:
                                print(f"[TRADES] Block {current_block}-{batch_end}: {len(logs)} trades")

                            for log in logs:
                                await self.process_log(log)

                        except Exception as e:
                            print(f"[WARN] 区块 {current_block}-{batch_end} 失败: {e}")

                        current_block = batch_end + 1
                        await asyncio.sleep(CATCHUP_DELAY)

                # 已追上最新区块，正常轮询
                await asyncio.sleep(poll_interval)

            except Exception as e:
                print(f"[ERROR] Listener error: {e}")
                await asyncio.sleep(5)  # 出错后等待 5 秒重试

    async def stop(self):
        """停止监听"""
        self.running = False
        print("[LISTENER] Stopped")

    async def process_log(self, log: Dict):
        """
        处理单条日志

        Args:
            log: 原始日志数据
        """
        # 解码交易
        trade_data = self.decoder.decode_order_filled(log)
        if not trade_data:
            return

        token_id = trade_data.get("token_id", "")

        # 匹配市场
        market_info = self.token_map.get(token_id)
        if not market_info:
            # 未知 token，可能不是我们关注的市场
            return

        market_slug = market_info["slug"]
        outcome = market_info["outcome"]

        # 计算 USD 金额
        price = trade_data["price"]
        size = trade_data["size"]
        amount_usd = price * size

        # 判断是否是大单
        is_whale = amount_usd >= self.whale_threshold

        # 获取区块时间戳
        try:
            block = self.w3.eth.get_block(trade_data["block_number"])
            timestamp = datetime.utcfromtimestamp(block["timestamp"])
        except Exception:
            timestamp = datetime.utcnow()

        # 存入数据库
        await self._save_trade(
            tx_hash=trade_data["tx_hash"],
            log_index=trade_data["log_index"],
            block_number=trade_data["block_number"],
            market_slug=market_slug,
            maker=trade_data["maker"],
            taker=trade_data["taker"],
            side=trade_data["side"],
            outcome=outcome,
            price=price,
            size=size,
            amount_usd=amount_usd,
            is_whale=is_whale,
            timestamp=timestamp,
        )

        # 大单警报
        if is_whale:
            print(f"[WHALE ALERT] {market_slug} [{outcome}]: ${amount_usd:.2f} USD ({trade_data['side']})")

            if self.on_whale_callback:
                await self.on_whale_callback({
                    "tx_hash": trade_data["tx_hash"],
                    "market_slug": market_slug,
                    "outcome": outcome,
                    "side": trade_data["side"],
                    "amount_usd": float(amount_usd),
                    "maker": trade_data["maker"],
                    "timestamp": timestamp.isoformat(),
                })

    async def _save_trade(
        self,
        tx_hash: str,
        log_index: int,
        block_number: int,
        market_slug: str,
        maker: str,
        taker: str,
        side: str,
        outcome: str,
        price: Decimal,
        size: Decimal,
        amount_usd: Decimal,
        is_whale: bool,
        timestamp: datetime,
    ):
        """保存交易到数据库"""
        async with self.session_factory() as session:
            # 检查是否已存在（去重）
            result = await session.execute(
                select(Trade).where(
                    Trade.tx_hash == tx_hash,
                    Trade.log_index == log_index
                )
            )
            existing = result.scalar_one_or_none()

            if existing:
                return  # 已存在，跳过

            trade = Trade(
                tx_hash=tx_hash,
                log_index=log_index,
                block_number=block_number,
                market_slug=market_slug,
                maker=maker,
                taker=taker,
                side=side,
                outcome=outcome,
                price=price,
                size=size,
                amount_usd=amount_usd,
                is_whale=is_whale,
                timestamp=timestamp,
            )

            session.add(trade)
            await session.commit()


async def run_listener():
    """运行监听器（独立脚本入口）"""
    from ..db import AsyncSessionLocal, init_db

    # 初始化数据库
    await init_db()

    # 创建监听器
    listener = TradeListener(AsyncSessionLocal)

    try:
        await listener.start()
    except KeyboardInterrupt:
        await listener.stop()
