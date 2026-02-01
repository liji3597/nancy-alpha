"""内幕分析模块 - 使用 DeepSeek V3 分析大单是否涉嫌内幕交易"""
import json
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Optional
from openai import AsyncOpenAI
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..models import Trade, InsiderAlert

settings = get_settings()


class InsiderAnalyzer:
    """内幕分析器"""

    def __init__(self, session_factory):
        """
        初始化分析器

        Args:
            session_factory: 异步数据库会话工厂
        """
        self.session_factory = session_factory
        self.client = AsyncOpenAI(
            base_url=settings.DEEPSEEK_BASE_URL,
            api_key=settings.DEEPSEEK_API_KEY,
        )
        self.model = settings.DEEPSEEK_MODEL

    async def analyze_trade(self, trade: Trade) -> Optional[InsiderAlert]:
        """
        分析单笔大单是否涉嫌内幕交易

        Args:
            trade: 交易记录

        Returns:
            InsiderAlert 或 None
        """
        # 构建 Prompt
        prompt = self._build_prompt(trade)

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """你是一个专业的金融分析师，专门分析 Polymarket 预测市场的交易行为。
你的任务是判断一笔大额交易是否可能涉及内幕信息。

分析要点：
1. 搜索交易发生时间前后的相关新闻
2. 对比交易时间与新闻发布时间
3. 如果交易发生在重大新闻发布之前，可能涉嫌内幕交易

请以 JSON 格式返回分析结果。"""
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=1000,
            )

            # 解析响应
            content = response.choices[0].message.content
            result = self._parse_response(content)

            if result:
                return InsiderAlert(
                    trade_id=trade.id,
                    market_slug=trade.market_slug,
                    trade_time=trade.timestamp,
                    trade_amount=trade.amount_usd,
                    trader_address=trade.maker,
                    related_news=result.get("related_news"),
                    news_source=result.get("news_source"),
                    news_time=result.get("news_time"),
                    time_diff_minutes=result.get("time_diff_minutes"),
                    is_suspect=result.get("is_suspect", False),
                    confidence=Decimal(str(result.get("confidence", 0))),
                    reason=result.get("reason"),
                )

        except Exception as e:
            print(f"分析失败: {e}")

        return None

    def _build_prompt(self, trade: Trade) -> str:
        """构建分析 Prompt"""
        return f"""请分析以下 Polymarket 大额交易：

交易信息：
- 市场: {trade.market_slug}
- 交易时间: {trade.timestamp.strftime("%Y-%m-%d %H:%M:%S")} UTC
- 交易金额: ${float(trade.amount_usd):,.2f} USD
- 交易方向: {trade.side} {trade.outcome}
- 交易者地址: {trade.maker}

请搜索该时间点前后 30 分钟内与该市场主题相关的新闻或公告。

分析要求：
1. 如果找到相关新闻，对比交易时间与新闻发布时间
2. 如果交易发生在新闻发布之前，评估可能的内幕交易风险
3. 给出置信度评分 (0.0-1.0)

请以以下 JSON 格式返回：
```json
{{
    "related_news": "相关新闻标题或摘要",
    "news_source": "新闻来源",
    "news_time": "2024-01-30T10:45:00",
    "time_diff_minutes": -15,
    "is_suspect": true,
    "confidence": 0.85,
    "reason": "交易发生在新闻发布前 15 分钟，存在内幕交易嫌疑"
}}
```

如果没有找到相关新闻，返回：
```json
{{
    "related_news": null,
    "news_source": null,
    "news_time": null,
    "time_diff_minutes": null,
    "is_suspect": false,
    "confidence": 0.1,
    "reason": "未找到相关新闻，无法判断"
}}
```"""

    def _parse_response(self, content: str) -> Optional[Dict]:
        """解析 AI 响应"""
        try:
            # 尝试提取 JSON
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                json_str = content.split("```")[1].split("```")[0].strip()
            else:
                json_str = content.strip()

            result = json.loads(json_str)

            # 解析时间
            if result.get("news_time") and isinstance(result["news_time"], str):
                try:
                    result["news_time"] = datetime.fromisoformat(
                        result["news_time"].replace("Z", "+00:00")
                    )
                except ValueError:
                    result["news_time"] = None

            return result

        except (json.JSONDecodeError, IndexError) as e:
            print(f"解析响应失败: {e}")
            return None

    async def scan_pending_trades(self, limit: int = 10) -> List[InsiderAlert]:
        """
        扫描待分析的大单

        Args:
            limit: 每次处理的数量限制

        Returns:
            生成的 InsiderAlert 列表
        """
        alerts = []

        async with self.session_factory() as session:
            # 查找未分析的大单
            # 使用子查询排除已分析的交易
            analyzed_trade_ids = select(InsiderAlert.trade_id).where(
                InsiderAlert.trade_id.isnot(None)
            )

            result = await session.execute(
                select(Trade)
                .where(
                    and_(
                        Trade.is_whale == True,
                        Trade.id.notin_(analyzed_trade_ids)
                    )
                )
                .order_by(Trade.timestamp.desc())
                .limit(limit)
            )
            pending_trades = result.scalars().all()

            print(f"发现 {len(pending_trades)} 笔待分析大单")

            for trade in pending_trades:
                print(f"分析交易: {trade.tx_hash[:16]}... ({trade.market_slug})")
                alert = await self.analyze_trade(trade)

                if alert:
                    session.add(alert)
                    alerts.append(alert)

                    if alert.is_suspect:
                        print(f"  ⚠️ 发现可疑交易! 置信度: {alert.confidence}")
                    else:
                        print(f"  ✓ 正常交易")

            await session.commit()

        return alerts

    async def get_alerts(
        self,
        session: AsyncSession,
        suspect_only: bool = False,
        limit: int = 20,
        offset: int = 0
    ) -> Dict:
        """
        获取内幕分析警报列表

        Args:
            session: 数据库会话
            suspect_only: 是否只返回可疑交易
            limit: 返回数量限制
            offset: 偏移量

        Returns:
            警报列表和总数
        """
        query = select(InsiderAlert)

        if suspect_only:
            query = query.where(InsiderAlert.is_suspect == True)

        # 获取总数
        count_query = select(InsiderAlert.id)
        if suspect_only:
            count_query = count_query.where(InsiderAlert.is_suspect == True)
        count_result = await session.execute(count_query)
        total = len(count_result.fetchall())

        # 获取数据
        query = query.order_by(InsiderAlert.analyzed_at.desc()).offset(offset).limit(limit)
        result = await session.execute(query)
        alerts = result.scalars().all()

        return {
            "total": total,
            "data": [
                {
                    "id": a.id,
                    "market_slug": a.market_slug,
                    "trade_time": a.trade_time.isoformat() if a.trade_time else None,
                    "trade_amount": float(a.trade_amount),
                    "trader_address": a.trader_address,
                    "related_news": a.related_news,
                    "news_source": a.news_source,
                    "news_time": a.news_time.isoformat() if a.news_time else None,
                    "time_diff_minutes": a.time_diff_minutes,
                    "is_suspect": a.is_suspect,
                    "confidence": float(a.confidence) if a.confidence else None,
                    "reason": a.reason,
                    "analyzed_at": a.analyzed_at.isoformat() if a.analyzed_at else None,
                }
                for a in alerts
            ],
        }
