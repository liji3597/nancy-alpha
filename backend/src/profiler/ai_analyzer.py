"""交易者画像AI分析模块 - 使用 DeepSeek V3 深度分析交易者行为"""
import json
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Optional
from openai import AsyncOpenAI
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..models import Trade, Market, TraderProfile

settings = get_settings()


class TraderAIProfiler:
    """交易者AI画像分析器"""

    def __init__(self, session_factory):
        """
        初始化AI分析器

        Args:
            session_factory: 异步数据库会话工厂
        """
        self.session_factory = session_factory
        self.client = AsyncOpenAI(
            base_url=settings.DEEPSEEK_BASE_URL,
            api_key=settings.DEEPSEEK_API_KEY,
        )
        self.model = settings.DEEPSEEK_MODEL

    async def analyze_trader(
        self,
        session: AsyncSession,
        address: str,
        force_refresh: bool = False
    ) -> Optional[Dict]:
        """
        使用AI深度分析单个交易者画像

        Args:
            session: 数据库会话
            address: 交易者地址
            force_refresh: 是否强制重新分析（忽略已有标签）

        Returns:
            分析结果字典
        """
        # 获取交易者画像
        profile_result = await session.execute(
            select(TraderProfile).where(TraderProfile.address == address)
        )
        profile = profile_result.scalar_one_or_none()

        if not profile:
            print(f"[WARN] Trader {address} not found, please run refresh-profiles first")
            return None

        # 如果已有AI标签且不强制刷新，跳过
        if profile.label and profile.ai_analysis and not force_refresh:
            print(f"[SKIP] Trader {address} already has AI analysis (use --force to refresh)")
            return {
                "address": address,
                "label": profile.label,
                "ai_analysis": profile.ai_analysis,
                "cached": True
            }

        # 获取交易历史
        trades_result = await session.execute(
            select(Trade)
            .where(Trade.maker == address)
            .order_by(Trade.timestamp.desc())
            .limit(100)  # 分析最近100笔交易
        )
        trades = trades_result.scalars().all()

        if not trades:
            print(f"[WARN] Trader {address} has no trade records")
            return None

        # 获取已结算市场信息
        market_slugs = list(set([t.market_slug for t in trades]))
        markets_result = await session.execute(
            select(Market).where(Market.slug.in_(market_slugs))
        )
        markets = {m.slug: m for m in markets_result.scalars().all()}

        # 构建分析数据
        analysis_data = self._prepare_analysis_data(profile, trades, markets)

        # 调用AI分析
        print(f"[AI] Analyzing trader {address[:10]}...")
        ai_result = await self._call_ai_analysis(analysis_data)

        if ai_result:
            # 更新数据库
            profile.label = ai_result.get("label")
            profile.ai_analysis = ai_result.get("analysis")
            profile.trading_style = ai_result.get("trading_style")
            profile.risk_preference = ai_result.get("risk_preference")
            profile.updated_at = datetime.utcnow()
            await session.commit()

            print(f"[OK] Analysis complete: {ai_result.get('label')}")
            return {
                "address": address,
                "label": ai_result.get("label"),
                "ai_analysis": ai_result.get("analysis"),
                "trading_style": ai_result.get("trading_style"),
                "risk_preference": ai_result.get("risk_preference"),
                "cached": False
            }

        return None

    def _prepare_analysis_data(
        self,
        profile: TraderProfile,
        trades: List[Trade],
        markets: Dict[str, Market]
    ) -> Dict:
        """准备AI分析所需的数据"""
        # 统计交易行为特征
        buy_count = sum(1 for t in trades if t.side == "BUY")
        sell_count = sum(1 for t in trades if t.side == "SELL")
        yes_count = sum(1 for t in trades if t.outcome == "YES")
        no_count = sum(1 for t in trades if t.outcome == "NO")

        # 统计已结算市场的表现
        settled_trades = []
        for trade in trades:
            market = markets.get(trade.market_slug)
            if market and market.resolved:
                is_win = False
                if trade.side == "BUY":
                    is_win = (trade.outcome == market.resolution_outcome)
                else:  # SELL
                    is_win = (trade.outcome != market.resolution_outcome)

                settled_trades.append({
                    "market": trade.market_slug,
                    "question": market.question if market.question else trade.market_slug,
                    "side": trade.side,
                    "outcome": trade.outcome,
                    "amount": float(trade.amount_usd),
                    "price": float(trade.price),
                    "timestamp": trade.timestamp.strftime("%Y-%m-%d %H:%M"),
                    "result": market.resolution_outcome,
                    "is_win": is_win
                })

        # 计算交易时间分布
        hours = [t.timestamp.hour for t in trades]
        peak_hours = max(set(hours), key=hours.count) if hours else 0

        # 计算交易金额分布
        whale_trades = sum(1 for t in trades if t.is_whale)
        avg_amount = sum(t.amount_usd for t in trades) / len(trades) if trades else 0

        return {
            "profile": {
                "address": profile.address,
                "total_trades": profile.total_trades,
                "total_volume": float(profile.total_volume),
                "win_rate": float(profile.win_rate),
                "win_count": profile.win_count,
                "loss_count": profile.loss_count,
                "avg_trade_size": float(profile.avg_trade_size),
                "trader_type": profile.trader_type,
            },
            "behavior_stats": {
                "buy_sell_ratio": f"{buy_count}:{sell_count}",
                "yes_no_ratio": f"{yes_count}:{no_count}",
                "whale_trades": whale_trades,
                "avg_amount": float(avg_amount),
                "peak_trading_hour": peak_hours,
            },
            "recent_trades": settled_trades[:20],  # 最近20笔已结算的交易
        }

    async def _call_ai_analysis(self, data: Dict) -> Optional[Dict]:
        """调用AI进行分析"""
        prompt = self._build_analysis_prompt(data)

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """你是一个专业的量化交易分析师，专门分析 Polymarket 预测市场的交易者行为。

你的任务是基于交易者的历史数据，深度分析其交易风格、决策特点和行为模式。

分析维度：
1. 交易风格（Trading Style）：激进/稳健/保守/投机
2. 风险偏好（Risk Preference）：高风险/中等/低风险
3. 决策特点：理性/情绪化/数据驱动/跟风
4. 擅长领域：政治/体育/娱乐等
5. 行为特征：长期持有/短线交易/对冲等

请用专业且有洞察力的语言，生成简洁的交易者画像。"""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=1500,
            )

            content = response.choices[0].message.content
            return self._parse_ai_response(content)

        except Exception as e:
            print(f"AI分析调用失败: {e}")
            return None

    def _build_analysis_prompt(self, data: Dict) -> str:
        """构建AI分析提示词"""
        profile = data["profile"]
        behavior = data["behavior_stats"]
        recent_trades = data["recent_trades"]

        trades_summary = "\n".join([
            f"- [{t['timestamp']}] {t['side']} {t['outcome']} @ ${t['amount']:.0f} "
            f"(市场: {t['question'][:50]}) "
            f"→ 实际结果: {t['result']} ({'✓胜' if t['is_win'] else '✗败'})"
            for t in recent_trades[:10]
        ])

        return f"""请分析以下交易者的行为画像：

## 基础数据
- 地址: {profile['address']}
- 总交易次数: {profile['total_trades']}
- 总交易量: ${profile['total_volume']:,.2f}
- 胜率: {profile['win_rate']:.1f}% ({profile['win_count']}胜 / {profile['loss_count']}败)
- 平均单笔金额: ${profile['avg_trade_size']:,.2f}
- 分类: {profile['trader_type']}

## 行为特征
- 买卖比例: {behavior['buy_sell_ratio']}
- YES/NO偏好: {behavior['yes_no_ratio']}
- 大单次数: {behavior['whale_trades']} (>$10,000)
- 活跃时段: {behavior['peak_trading_hour']}点

## 最近交易记录（已结算市场）
{trades_summary if trades_summary else "暂无已结算交易"}

---

请以JSON格式返回分析结果：

```json
{{
    "label": "简短标签（5-10字，如：激进型政治预测专家、稳健长线价值投资者）",
    "trading_style": "交易风格（激进/稳健/保守/投机/对冲）",
    "risk_preference": "风险偏好（高/中/低）",
    "analysis": "深度分析（150-300字，包含：\n1. 核心特征总结\n2. 交易决策特点\n3. 优势与风险\n4. 典型行为模式\n请用专业且客观的语言）"
}}
```

注意：
- 如果胜率极高但交易次数少，可能是运气或样本不足
- 如果交易量大但胜率一般，可能是专业对冲或套利
- 如果频繁大额交易，分析其是否有内幕信息优势
- 结合具体交易记录，给出有洞察力的评价"""

    def _parse_ai_response(self, content: str) -> Optional[Dict]:
        """解析AI响应"""
        try:
            # 提取JSON
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                json_str = content.split("```")[1].split("```")[0].strip()
            else:
                json_str = content.strip()

            result = json.loads(json_str)
            return result

        except (json.JSONDecodeError, IndexError) as e:
            print(f"解析AI响应失败: {e}")
            print(f"原始响应: {content}")
            return None

    async def batch_analyze(
        self,
        limit: int = 50,
        min_trades: int = 5,
        force_refresh: bool = False
    ) -> List[Dict]:
        """
        批量分析交易者

        Args:
            limit: 分析数量限制
            min_trades: 最小交易次数（过滤小用户）
            force_refresh: 是否强制重新分析

        Returns:
            分析结果列表
        """
        results = []

        async with self.session_factory() as session:
            # 获取符合条件的交易者
            query = select(TraderProfile).where(
                TraderProfile.total_trades >= min_trades
            )

            if not force_refresh:
                # 只分析未分析过的
                query = query.where(TraderProfile.label.is_(None))

            query = query.order_by(TraderProfile.total_volume.desc()).limit(limit)

            result = await session.execute(query)
            profiles = result.scalars().all()

            print(f"[INFO] Found {len(profiles)} traders to analyze")

            for profile in profiles:
                analysis = await self.analyze_trader(
                    session,
                    profile.address,
                    force_refresh=force_refresh
                )
                if analysis:
                    results.append(analysis)

        return results

    async def get_top_traders_with_ai(
        self,
        session: AsyncSession,
        limit: int = 20,
        trader_type: Optional[str] = None
    ) -> List[Dict]:
        """
        获取带AI分析的顶级交易者排行榜

        Args:
            session: 数据库会话
            limit: 返回数量
            trader_type: 筛选类型（smart_money/dumb_money/normal）

        Returns:
            交易者列表
        """
        query = select(TraderProfile).where(
            TraderProfile.label.isnot(None)  # 只返回已AI分析的
        )

        if trader_type:
            query = query.where(TraderProfile.trader_type == trader_type)

        query = query.order_by(TraderProfile.win_rate.desc()).limit(limit)

        result = await session.execute(query)
        profiles = result.scalars().all()

        return [
            {
                "address": p.address,
                "label": p.label,
                "trader_type": p.trader_type,
                "trading_style": p.trading_style,
                "risk_preference": p.risk_preference,
                "ai_analysis": p.ai_analysis,
                "win_rate": float(p.win_rate),
                "total_trades": p.total_trades,
                "total_volume": float(p.total_volume),
                "avg_trade_size": float(p.avg_trade_size),
                "last_trade_at": p.last_trade_at.isoformat() if p.last_trade_at else None,
            }
            for p in profiles
        ]
