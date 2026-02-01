"""市场发现模块 - 从 Gamma API 获取 Polymarket 市场数据"""
import json
import httpx
from typing import List, Dict, Optional
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..models import Market

settings = get_settings()


class MarketDiscovery:
    """市场发现服务"""

    def __init__(self):
        self.base_url = settings.GAMMA_API_URL
        self.client = httpx.AsyncClient(timeout=30.0)

    async def close(self):
        """关闭 HTTP 客户端"""
        await self.client.aclose()

    async def fetch_politics_markets(self, limit: int = 100) -> List[Dict]:
        """
        获取政治类活跃市场

        Args:
            limit: 获取数量限制

        Returns:
            市场数据列表
        """
        # Gamma API 参数
        params = {
            "active": "true",
            "closed": "false",
            "limit": limit,
        }

        try:
            response = await self.client.get(
                f"{self.base_url}/markets",
                params=params
            )
            response.raise_for_status()
            data = response.json()

            markets = []
            for m in data:
                # 筛选政治类市场 (通过 tags 或 category)
                tags = m.get("tags", [])
                tag_names = [t.get("label", "").lower() if isinstance(t, dict) else str(t).lower() for t in tags]

                # 检查是否是政治类
                is_politics = any(
                    keyword in tag_names or keyword in m.get("category", "").lower()
                    for keyword in ["politics", "political", "election", "government"]
                )

                if not is_politics:
                    continue

                # 解析 clobTokenIds (可能是 JSON 字符串或列表)
                clob_token_ids_raw = m.get("clobTokenIds", "[]")
                if isinstance(clob_token_ids_raw, str):
                    try:
                        clob_token_ids = json.loads(clob_token_ids_raw)
                    except json.JSONDecodeError:
                        clob_token_ids = []
                else:
                    clob_token_ids = clob_token_ids_raw

                if not isinstance(clob_token_ids, list) or len(clob_token_ids) < 2:
                    continue

                markets.append({
                    "slug": m.get("slug", ""),
                    "condition_id": m.get("conditionId", ""),
                    "yes_token_id": clob_token_ids[0],
                    "no_token_id": clob_token_ids[1],
                    "category": "Politics",
                    "question": m.get("question", ""),
                    "active": m.get("active", True),
                })

            return markets

        except httpx.HTTPError as e:
            print(f"获取市场数据失败: {e}")
            return []

    async def fetch_all_active_markets(self, limit: int = 200) -> List[Dict]:
        """
        获取所有活跃市场（不限类别，用于 token 匹配）

        Args:
            limit: 获取数量限制

        Returns:
            市场数据列表
        """
        params = {
            "active": "true",
            "closed": "false",
            "limit": limit,
        }

        try:
            response = await self.client.get(
                f"{self.base_url}/markets",
                params=params
            )
            response.raise_for_status()
            data = response.json()

            markets = []
            for m in data:
                # 解析 clobTokenIds (可能是 JSON 字符串或列表)
                clob_token_ids_raw = m.get("clobTokenIds", "[]")
                if isinstance(clob_token_ids_raw, str):
                    try:
                        clob_token_ids = json.loads(clob_token_ids_raw)
                    except json.JSONDecodeError:
                        clob_token_ids = []
                else:
                    clob_token_ids = clob_token_ids_raw

                if not isinstance(clob_token_ids, list) or len(clob_token_ids) < 2:
                    continue

                markets.append({
                    "slug": m.get("slug", ""),
                    "condition_id": m.get("conditionId", ""),
                    "yes_token_id": clob_token_ids[0],
                    "no_token_id": clob_token_ids[1],
                    "category": m.get("category", "Other"),
                    "question": m.get("question", ""),
                    "active": m.get("active", True),
                })

            return markets

        except httpx.HTTPError as e:
            print(f"获取市场数据失败: {e}")
            return []

    async def sync_markets_to_db(self, session: AsyncSession, markets: List[Dict]) -> int:
        """
        同步市场数据到数据库

        Args:
            session: 数据库会话
            markets: 市场数据列表

        Returns:
            新增/更新的市场数量
        """
        count = 0

        for market_data in markets:
            slug = market_data.get("slug")
            if not slug:
                continue

            # 检查是否已存在
            result = await session.execute(
                select(Market).where(Market.slug == slug)
            )
            existing = result.scalar_one_or_none()

            if existing:
                # 更新现有记录
                existing.condition_id = market_data.get("condition_id", existing.condition_id)
                existing.yes_token_id = market_data.get("yes_token_id", existing.yes_token_id)
                existing.no_token_id = market_data.get("no_token_id", existing.no_token_id)
                existing.question = market_data.get("question", existing.question)
                existing.active = market_data.get("active", existing.active)
                existing.updated_at = datetime.utcnow()
            else:
                # 创建新记录
                new_market = Market(
                    slug=slug,
                    condition_id=market_data.get("condition_id", ""),
                    yes_token_id=market_data.get("yes_token_id", ""),
                    no_token_id=market_data.get("no_token_id", ""),
                    category=market_data.get("category", "Politics"),
                    question=market_data.get("question", ""),
                    active=market_data.get("active", True),
                )
                session.add(new_market)
                count += 1

        await session.commit()
        return count

    async def get_token_to_market_map(self, session: AsyncSession) -> Dict[str, Dict]:
        """
        构建 token_id 到市场的映射表

        Returns:
            {token_id: {"slug": ..., "outcome": "YES"/"NO"}}
        """
        result = await session.execute(select(Market).where(Market.active == True))
        markets = result.scalars().all()

        token_map = {}
        for m in markets:
            token_map[m.yes_token_id] = {"slug": m.slug, "outcome": "YES"}
            token_map[m.no_token_id] = {"slug": m.slug, "outcome": "NO"}

        return token_map
