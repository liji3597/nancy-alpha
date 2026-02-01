"""交易者画像分析模块 - 计算胜率和交易者分类"""
from decimal import Decimal
from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..models import Trade, Market, TraderProfile

settings = get_settings()


class TraderProfiler:
    """交易者画像分析器"""

    def __init__(self, session_factory):
        """
        初始化分析器

        Args:
            session_factory: 异步数据库会话工厂
        """
        self.session_factory = session_factory
        self.smart_money_win_rate = Decimal(str(settings.SMART_MONEY_WIN_RATE * 100))
        self.smart_money_min_volume = Decimal(str(settings.SMART_MONEY_MIN_VOLUME))
        self.dumb_money_win_rate = Decimal(str(settings.DUMB_MONEY_WIN_RATE * 100))

    async def update_profile(self, address: str) -> Optional[TraderProfile]:
        """
        更新单个地址的画像

        Args:
            address: 交易者地址

        Returns:
            更新后的 TraderProfile
        """
        async with self.session_factory() as session:
            # 获取该地址的所有交易
            trades_result = await session.execute(
                select(Trade).where(Trade.maker == address)
            )
            trades = trades_result.scalars().all()

            if not trades:
                return None

            # 获取已结算市场
            resolved_markets = await session.execute(
                select(Market).where(Market.resolved == True)
            )
            resolved_map = {m.slug: m.resolution_outcome for m in resolved_markets.scalars().all()}

            # 统计胜负
            total_trades = len(trades)
            total_volume = Decimal(0)
            win_count = 0
            loss_count = 0
            last_trade_at = None

            for trade in trades:
                total_volume += trade.amount_usd

                if last_trade_at is None or trade.timestamp > last_trade_at:
                    last_trade_at = trade.timestamp

                # 只统计已结算市场的胜负
                if trade.market_slug in resolved_map:
                    resolution = resolved_map[trade.market_slug]
                    # 判断胜负：买入的 outcome 等于结算结果则胜
                    if trade.side == "BUY":
                        if trade.outcome == resolution:
                            win_count += 1
                        else:
                            loss_count += 1
                    else:  # SELL
                        # 卖出的情况：卖出的 outcome 不等于结算结果则胜
                        if trade.outcome != resolution:
                            win_count += 1
                        else:
                            loss_count += 1

            # 计算胜率
            settled_trades = win_count + loss_count
            if settled_trades > 0:
                win_rate = Decimal(win_count * 100) / Decimal(settled_trades)
            else:
                win_rate = Decimal(0)

            # 计算平均交易大小
            avg_trade_size = total_volume / Decimal(total_trades) if total_trades > 0 else Decimal(0)

            # 分类交易者
            trader_type = self._classify_trader(win_rate, total_volume, total_trades)

            # 更新或创建 profile
            profile_result = await session.execute(
                select(TraderProfile).where(TraderProfile.address == address)
            )
            profile = profile_result.scalar_one_or_none()

            if profile:
                profile.total_trades = total_trades
                profile.total_volume = total_volume
                profile.win_count = win_count
                profile.loss_count = loss_count
                profile.win_rate = win_rate
                profile.avg_trade_size = avg_trade_size
                profile.trader_type = trader_type
                profile.last_trade_at = last_trade_at
                profile.updated_at = datetime.utcnow()
            else:
                profile = TraderProfile(
                    address=address,
                    total_trades=total_trades,
                    total_volume=total_volume,
                    win_count=win_count,
                    loss_count=loss_count,
                    win_rate=win_rate,
                    avg_trade_size=avg_trade_size,
                    trader_type=trader_type,
                    last_trade_at=last_trade_at,
                )
                session.add(profile)

            await session.commit()
            return profile

    def _classify_trader(
        self,
        win_rate: Decimal,
        total_volume: Decimal,
        total_trades: int
    ) -> str:
        """
        分类交易者类型

        Args:
            win_rate: 胜率 (0-100)
            total_volume: 总交易量
            total_trades: 总交易次数

        Returns:
            'smart_money' / 'dumb_money' / 'normal'
        """
        # 聪明钱：胜率 > 90% 且交易量 > 1000
        if win_rate >= self.smart_money_win_rate and total_volume >= self.smart_money_min_volume:
            return "smart_money"

        # 笨蛋钱：胜率 < 30% 且交易次数 > 10
        if win_rate <= self.dumb_money_win_rate and total_trades > 10:
            return "dumb_money"

        return "normal"

    async def refresh_all_profiles(self) -> int:
        """
        刷新所有交易者画像

        Returns:
            更新的画像数量
        """
        async with self.session_factory() as session:
            # 获取所有交易者地址
            result = await session.execute(
                select(Trade.maker).distinct()
            )
            addresses = [row[0] for row in result.fetchall()]

        count = 0
        for address in addresses:
            await self.update_profile(address)
            count += 1

        print(f"已刷新 {count} 个交易者画像")
        return count

    async def get_leaderboard(
        self,
        session: AsyncSession,
        limit: int = 50,
        min_trades: int = 5,
        trader_type: Optional[str] = None
    ) -> List[Dict]:
        """
        获取胜率排行榜

        Args:
            session: 数据库会话
            limit: 返回数量限制
            min_trades: 最小交易次数
            trader_type: 筛选交易者类型

        Returns:
            排行榜数据
        """
        query = select(TraderProfile).where(
            TraderProfile.total_trades >= min_trades
        )

        if trader_type:
            query = query.where(TraderProfile.trader_type == trader_type)

        query = query.order_by(TraderProfile.win_rate.desc()).limit(limit)

        result = await session.execute(query)
        profiles = result.scalars().all()

        return [
            {
                "address": p.address,
                "win_rate": float(p.win_rate),
                "total_trades": p.total_trades,
                "win_count": p.win_count,
                "loss_count": p.loss_count,
                "total_volume": float(p.total_volume),
                "avg_trade_size": float(p.avg_trade_size),
                "trader_type": p.trader_type,
                "label": p.label,
                "last_trade_at": p.last_trade_at.isoformat() if p.last_trade_at else None,
            }
            for p in profiles
        ]

    async def get_trader_detail(
        self,
        session: AsyncSession,
        address: str
    ) -> Optional[Dict]:
        """
        获取交易者详情

        Args:
            session: 数据库会话
            address: 交易者地址

        Returns:
            交易者详情
        """
        # 获取画像
        result = await session.execute(
            select(TraderProfile).where(TraderProfile.address == address)
        )
        profile = result.scalar_one_or_none()

        if not profile:
            return None

        # 获取最近交易
        trades_result = await session.execute(
            select(Trade)
            .where(Trade.maker == address)
            .order_by(Trade.timestamp.desc())
            .limit(20)
        )
        recent_trades = trades_result.scalars().all()

        return {
            "address": profile.address,
            "win_rate": float(profile.win_rate),
            "total_trades": profile.total_trades,
            "win_count": profile.win_count,
            "loss_count": profile.loss_count,
            "total_volume": float(profile.total_volume),
            "avg_trade_size": float(profile.avg_trade_size),
            "trader_type": profile.trader_type,
            "label": profile.label,
            "last_trade_at": profile.last_trade_at.isoformat() if profile.last_trade_at else None,
            "recent_trades": [
                {
                    "tx_hash": t.tx_hash,
                    "market_slug": t.market_slug,
                    "side": t.side,
                    "outcome": t.outcome,
                    "amount_usd": float(t.amount_usd),
                    "price": float(t.price),
                    "timestamp": t.timestamp.isoformat(),
                }
                for t in recent_trades
            ],
        }
