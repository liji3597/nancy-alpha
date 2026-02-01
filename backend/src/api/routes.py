"""API 路由模块 - REST 接口定义"""
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..models import Trade, Market, TraderProfile, InsiderAlert
from ..profiler.analyzer import TraderProfiler
from ..agent.insider import InsiderAnalyzer

router = APIRouter(prefix="/api", tags=["default"])


@router.get("/health", tags=["System"])
async def health_check():
    """健康检查接口 - 检查服务运行状态"""
    return {"status": "ok", "service": "insider-hunter"}


# ==================== 大单接口 ====================

@router.get("/whales/live", tags=["Whale Trades"])
async def get_live_whales(
    limit: int = Query(default=20, ge=1, le=100, description="返回数量"),
    offset: int = Query(default=0, ge=0, description="偏移量"),
    market_slug: Optional[str] = Query(default=None, description="筛选特定市场"),
    db: AsyncSession = Depends(get_db)
):
    """
    # 获取实时大单列表

    查询金额 >= $10,000 的大额交易（鲸鱼交易）。

    ## 功能说明
    - 默认按时间倒序排列（最新的在前）
    - 可选筛选特定市场
    - 支持分页查询

    ## 使用场景
    - 监控市场上的大额交易动向
    - 跟踪鲸鱼交易者的行为
    - 发现潜在的市场趋势
    """
    query = select(Trade).where(Trade.is_whale == True)

    if market_slug:
        query = query.where(Trade.market_slug == market_slug)

    # 获取总数
    count_query = select(func.count(Trade.id)).where(Trade.is_whale == True)
    if market_slug:
        count_query = count_query.where(Trade.market_slug == market_slug)
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # 获取数据
    query = query.order_by(Trade.timestamp.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    trades = result.scalars().all()

    return {
        "total": total,
        "data": [
            {
                "tx_hash": t.tx_hash,
                "market_slug": t.market_slug,
                "maker": t.maker,
                "side": t.side,
                "outcome": t.outcome,
                "price": float(t.price),
                "size": float(t.size),
                "amount_usd": float(t.amount_usd),
                "timestamp": t.timestamp.isoformat(),
            }
            for t in trades
        ],
    }


# ==================== 市场接口 ====================

@router.get("/markets", tags=["Markets"])
async def get_markets(
    limit: int = Query(default=50, ge=1, le=200, description="返回数量"),
    offset: int = Query(default=0, ge=0, description="偏移量"),
    active_only: bool = Query(default=True, description="是否只返回活跃市场"),
    db: AsyncSession = Depends(get_db)
):
    """
    # 获取市场列表

    查询 Polymarket 上的预测市场列表。

    ## 筛选条件
    - **active_only=true**: 只返回未结算的活跃市场
    - **active_only=false**: 返回所有市场（包括已结算）
    """
    query = select(Market)

    if active_only:
        query = query.where(Market.active == True)

    # 获取总数
    count_query = select(func.count(Market.id))
    if active_only:
        count_query = count_query.where(Market.active == True)
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # 获取数据
    query = query.order_by(Market.updated_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    markets = result.scalars().all()

    return {
        "total": total,
        "data": [
            {
                "slug": m.slug,
                "question": m.question,
                "condition_id": m.condition_id,
                "yes_token_id": m.yes_token_id,
                "no_token_id": m.no_token_id,
                "category": m.category,
                "resolved": m.resolved,
                "resolution_outcome": m.resolution_outcome,
                "active": m.active,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in markets
        ],
    }


@router.get("/market/{slug}", tags=["Markets"])
async def get_market_detail(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """
    # 获取市场详情

    查询单个市场的详细信息、交易统计和最近交易记录。

    ## 返回内容
    - 市场基本信息（问题、token ID、结算状态等）
    - 交易统计（总交易数、总交易量、大单数）
    - 最近10笔交易记录
    """
    result = await db.execute(
        select(Market).where(Market.slug == slug)
    )
    market = result.scalar_one_or_none()

    if not market:
        raise HTTPException(status_code=404, detail="市场不存在")

    # 获取该市场的交易统计
    trades_result = await db.execute(
        select(
            func.count(Trade.id).label("trade_count"),
            func.sum(Trade.amount_usd).label("total_volume"),
            func.count(Trade.id).filter(Trade.is_whale == True).label("whale_count"),
        ).where(Trade.market_slug == slug)
    )
    stats = trades_result.one()

    # 获取最近交易
    recent_trades_result = await db.execute(
        select(Trade)
        .where(Trade.market_slug == slug)
        .order_by(Trade.timestamp.desc())
        .limit(10)
    )
    recent_trades = recent_trades_result.scalars().all()

    return {
        "slug": market.slug,
        "question": market.question,
        "condition_id": market.condition_id,
        "yes_token_id": market.yes_token_id,
        "no_token_id": market.no_token_id,
        "category": market.category,
        "resolved": market.resolved,
        "resolution_outcome": market.resolution_outcome,
        "active": market.active,
        "stats": {
            "trade_count": stats.trade_count or 0,
            "total_volume": float(stats.total_volume) if stats.total_volume else 0,
            "whale_count": stats.whale_count or 0,
        },
        "recent_trades": [
            {
                "tx_hash": t.tx_hash,
                "maker": t.maker,
                "side": t.side,
                "outcome": t.outcome,
                "amount_usd": float(t.amount_usd),
                "timestamp": t.timestamp.isoformat(),
            }
            for t in recent_trades
        ],
    }


# ==================== 交易者接口 ====================

@router.get("/traders/leaderboard", tags=["Trader Profile"])
async def get_traders_leaderboard(
    limit: int = Query(default=20, ge=1, le=100, description="返回数量"),
    min_trades: int = Query(default=5, ge=1, description="最小交易次数"),
    trader_type: Optional[str] = Query(
        default=None,
        regex="^(smart_money|dumb_money|normal)$",
        description="交易者类型: smart_money(聪明钱)/dumb_money(笨蛋钱)/normal(普通)"
    ),
    db: AsyncSession = Depends(get_db)
):
    """
    # 获取交易者胜率排行榜（基础统计）

    返回基于历史交易数据计算的交易者排行榜。

    ## 排序规则
    - 按胜率从高到低排序
    - 只统计已结算市场的交易

    ## 分类说明
    - **smart_money**: 胜率 >= 90% 且交易量 >= $1,000
    - **dumb_money**: 胜率 <= 30% 且交易次数 > 10
    - **normal**: 其他交易者

    ## 注意
    此接口返回基础统计数据，不包含AI分析。如需AI画像请使用 `/api/traders/ai-leaderboard`
    """
    from ..db import AsyncSessionLocal

    profiler = TraderProfiler(AsyncSessionLocal)
    leaderboard = await profiler.get_leaderboard(
        session=db,
        limit=limit,
        min_trades=min_trades,
        trader_type=trader_type
    )

    return {"data": leaderboard}


@router.get("/trader/{address}", tags=["Trader Profile"])
async def get_trader_detail(
    address: str,
    db: AsyncSession = Depends(get_db)
):
    """
    # 获取交易者详情

    查询指定钱包地址的交易者画像和交易历史。

    ## 返回内容
    - 基础统计（胜率、交易量、交易次数等）
    - 交易者分类
    - 最近20笔交易记录
    - AI标签（如果已分析）
    """
    from ..db import AsyncSessionLocal

    profiler = TraderProfiler(AsyncSessionLocal)
    detail = await profiler.get_trader_detail(session=db, address=address)

    if not detail:
        raise HTTPException(status_code=404, detail="交易者不存在")

    return detail


# ==================== 内幕分析接口 ====================

@router.get("/insider/alerts", tags=["Insider Analysis"])
async def get_insider_alerts(
    suspect_only: bool = Query(default=False, description="是否只返回可疑交易"),
    limit: int = Query(default=20, ge=1, le=100, description="返回数量"),
    offset: int = Query(default=0, ge=0, description="偏移量"),
    db: AsyncSession = Depends(get_db)
):
    """
    # 获取内幕分析警报列表

    查询AI分析的内幕交易警报。

    ## 分析逻辑
    - AI搜索交易时间前后30分钟的相关新闻
    - 对比交易时间与新闻发布时间
    - 如果交易发生在新闻之前，标记为可疑
    - 生成置信度评分（0.0-1.0）

    ## 筛选条件
    - **suspect_only=true**: 只返回 is_suspect=true 的警报
    - **suspect_only=false**: 返回所有分析记录
    """
    from ..db import AsyncSessionLocal

    analyzer = InsiderAnalyzer(AsyncSessionLocal)
    return await analyzer.get_alerts(
        session=db,
        suspect_only=suspect_only,
        limit=limit,
        offset=offset
    )


@router.post("/insider/analyze", tags=["Insider Analysis"])
async def trigger_insider_analysis(
    limit: int = Query(default=5, ge=1, le=20, description="分析的交易数量"),
):
    """
    # 手动触发内幕分析

    对未分析的大单交易进行AI内幕分析。

    ## 执行流程
    1. 从数据库查询未分析的大单（is_whale=true）
    2. 对每笔交易调用AI搜索相关新闻
    3. 分析交易时间与新闻时间的关系
    4. 生成内幕嫌疑评分和分析报告
    5. 保存到 insider_alerts 表

    ## 注意事项
    - 每次分析会消耗AI API额度
    - 建议设置较小的limit进行测试（5-10）
    - 已分析过的交易会被跳过
    """
    from ..db import AsyncSessionLocal

    analyzer = InsiderAnalyzer(AsyncSessionLocal)
    alerts = await analyzer.scan_pending_trades(limit=limit)

    suspect_count = sum(1 for a in alerts if a.is_suspect)

    return {
        "analyzed": len(alerts),
        "suspect_count": suspect_count,
        "message": f"已分析 {len(alerts)} 笔交易，发现 {suspect_count} 笔可疑交易",
    }


# ==================== AI 交易者画像接口 ====================

@router.get("/traders/ai-leaderboard", tags=["AI Trader Profile"])
async def get_ai_leaderboard(
    limit: int = Query(default=20, ge=1, le=100, description="返回数量"),
    trader_type: Optional[str] = Query(
        default=None,
        regex="^(smart_money|dumb_money|normal)$",
        description="交易者类型筛选: smart_money(聪明钱)/dumb_money(笨蛋钱)/normal(普通)"
    ),
    db: AsyncSession = Depends(get_db)
):
    """
    # 获取AI交易者画像排行榜

    返回带AI深度分析的交易者排行榜，只包含已完成AI分析的交易者。

    ## 响应字段说明
    - **label**: AI生成的个性化标签（如"激进型政治预测专家"）
    - **trading_style**: 交易风格（激进/稳健/保守/投机/对冲）
    - **risk_preference**: 风险偏好（高/中/低）
    - **ai_analysis**: AI深度分析文本（150-300字专业评价）

    ## 使用场景
    - 查看顶级交易者的AI画像分析
    - 筛选特定类型的交易者
    - 学习成功交易者的行为模式
    """
    from ..db import AsyncSessionLocal
    from ..profiler.ai_analyzer import TraderAIProfiler

    ai_profiler = TraderAIProfiler(AsyncSessionLocal)
    leaderboard = await ai_profiler.get_top_traders_with_ai(
        session=db,
        limit=limit,
        trader_type=trader_type
    )

    return {"data": leaderboard}


@router.post("/traders/{address}/ai-analyze", tags=["AI Trader Profile"])
async def analyze_trader_ai(
    address: str,
    force_refresh: bool = Query(
        default=False,
        description="是否强制重新分析（忽略缓存）"
    ),
    db: AsyncSession = Depends(get_db)
):
    """
    # 对单个交易者进行AI画像分析

    分析指定钱包地址的交易者行为，生成AI画像评价。

    ## 功能说明
    - 首次分析会调用AI生成画像
    - 已分析过的交易者返回缓存结果（除非使用 force_refresh=true）
    - 分析维度包括：交易风格、风险偏好、决策特点、行为模式等

    ## 前置条件
    - 交易者必须在数据库中有基础画像记录
    - 建议交易次数 >= 5 次，否则分析可能不准确

    ## 注意事项
    - AI分析会消耗API额度（约0.01-0.02元/次）
    - 首次分析可能需要5-10秒
    - 建议先查看基础画像后再决定是否AI分析
    """
    from ..db import AsyncSessionLocal
    from ..profiler.ai_analyzer import TraderAIProfiler

    ai_profiler = TraderAIProfiler(AsyncSessionLocal)
    result = await ai_profiler.analyze_trader(
        session=db,
        address=address,
        force_refresh=force_refresh
    )

    if not result:
        raise HTTPException(status_code=404, detail="交易者不存在或分析失败")

    return result


@router.post("/traders/batch-ai-analyze", tags=["AI Trader Profile"])
async def batch_analyze_traders(
    limit: int = Query(
        default=50,
        ge=1,
        le=200,
        description="分析数量（建议首次测试用10-20）"
    ),
    min_trades: int = Query(
        default=5,
        ge=1,
        description="最小交易次数（用于筛选活跃交易者）"
    ),
    force_refresh: bool = Query(
        default=False,
        description="是否强制重新分析已有标签的交易者"
    ),
):
    """
    # 批量AI分析交易者

    批量对多个交易者进行AI画像分析，适合首次部署或定期刷新使用。

    ## 使用场景
    1. **首次部署**: 分析所有活跃交易者（建议 limit=100-200）
    2. **定期更新**: 分析新出现的活跃交易者（不使用 force_refresh）
    3. **全量刷新**: 重新分析所有交易者（使用 force_refresh=true）

    ## 执行流程
    1. 从数据库筛选符合条件的交易者（total_trades >= min_trades）
    2. 如果不强制刷新，跳过已有AI标签的交易者
    3. 依次调用AI进行分析
    4. 返回批量分析结果

    ## 成本估算
    - 每个交易者消耗约 0.01-0.02 元 API 额度
    - 50个交易者约 0.5-1 元
    - 200个交易者约 2-4 元

    ## 性能建议
    - 首次测试建议 limit=10-20
    - 大批量分析建议在后台运行
    - API有速率限制，每次不超过200个

    ## 返回结果
    - **analyzed**: 成功分析的数量
    - **message**: 简要说明
    - **results**: 详细的分析结果列表
    """
    from ..db import AsyncSessionLocal
    from ..profiler.ai_analyzer import TraderAIProfiler

    ai_profiler = TraderAIProfiler(AsyncSessionLocal)
    results = await ai_profiler.batch_analyze(
        limit=limit,
        min_trades=min_trades,
        force_refresh=force_refresh
    )

    return {
        "analyzed": len(results),
        "message": f"已完成 {len(results)} 个交易者的AI画像分析",
        "results": results
    }
