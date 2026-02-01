"""Insider Hunter - Polymarket 内幕猎手主入口"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import init_db, close_db, AsyncSessionLocal
from .api.routes import router
from .indexer.discovery import MarketDiscovery
from .indexer.listener import TradeListener
from .indexer.backfill import HistoryBackfill
from .indexer.fast_backfill import FastBackfill
from .profiler.analyzer import TraderProfiler
from .agent.insider import InsiderAnalyzer

settings = get_settings()

# 全局服务实例
listener: TradeListener = None
discovery: MarketDiscovery = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    global listener, discovery

    # Startup
    print("[STARTUP] Insider Hunter starting...")

    # Initialize database
    await init_db()
    print("[OK] Database initialized")

    # Initialize market discovery service
    discovery = MarketDiscovery()

    # Sync market data
    try:
        markets = await discovery.fetch_all_active_markets(limit=200)
        async with AsyncSessionLocal() as session:
            count = await discovery.sync_markets_to_db(session, markets)
            print(f"[OK] Synced {count} new markets, total {len(markets)} active markets")
    except Exception as e:
        print(f"[WARNING] Market sync failed: {e}")

    # Initialize blockchain listener
    listener = TradeListener(AsyncSessionLocal)

    # Start listener in background
    asyncio.create_task(listener.start())
    print("[OK] Blockchain listener started")

    print("[OK] Insider Hunter started successfully!")
    print(f"  API URL: http://localhost:8000")
    print(f"  Docs URL: http://localhost:8000/docs")

    yield

    # Shutdown
    print("[SHUTDOWN] Insider Hunter shutting down...")

    if listener:
        await listener.stop()

    if discovery:
        await discovery.close()

    await close_db()
    print("[OK] Safely closed")


# 创建 FastAPI 应用
app = FastAPI(
    title="Insider Hunter",
    description="Polymarket 政治突发事件内幕猎手 - 链上大单监控与内幕分析系统",
    version="1.0.0",
    lifespan=lifespan,
)

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(router)


@app.get("/")
async def root():
    """根路径"""
    return {
        "name": "Insider Hunter",
        "description": "Polymarket 政治突发事件内幕猎手",
        "version": "1.0.0",
        "docs": "/docs",
    }


# CLI 入口点
def run_server():
    """运行 API 服务器"""
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )


async def run_profiler_refresh():
    """运行交易者画像刷新"""
    await init_db()
    profiler = TraderProfiler(AsyncSessionLocal)
    await profiler.refresh_all_profiles()
    await close_db()


async def run_insider_scan():
    """运行内幕分析扫描"""
    await init_db()
    analyzer = InsiderAnalyzer(AsyncSessionLocal)
    await analyzer.scan_pending_trades(limit=10)
    await close_db()


async def run_ai_profile_analysis(limit: int = 50, min_trades: int = 5, force: bool = False):
    """Run AI trader profile analysis"""
    from .profiler.ai_analyzer import TraderAIProfiler

    await init_db()
    ai_profiler = TraderAIProfiler(AsyncSessionLocal)

    print(f"[AI Analysis] Starting analysis (max {limit} traders, min {min_trades} trades)")
    if force:
        print("[WARNING] Force refresh mode: will re-analyze traders with existing labels")

    results = await ai_profiler.batch_analyze(
        limit=limit,
        min_trades=min_trades,
        force_refresh=force
    )

    print(f"\n[SUCCESS] Analysis complete! Analyzed {len(results)} traders")

    # Show preview of results
    if results:
        print("\n[PREVIEW] Analysis Results:")
        for i, result in enumerate(results[:5], 1):
            if not result.get('cached'):
                print(f"\n{i}. {result['address'][:10]}...")
                print(f"   Label: {result.get('label', 'N/A')}")
                print(f"   Style: {result.get('trading_style', 'N/A')} | Risk: {result.get('risk_preference', 'N/A')}")

    await close_db()


async def run_history_backfill(months: int = 6):
    """运行历史数据回填"""
    backfill = HistoryBackfill()
    await backfill.backfill(months=months)


async def run_sync_markets():
    """同步市场数据"""
    await init_db()
    discovery = MarketDiscovery()
    try:
        markets = await discovery.fetch_all_active_markets(limit=200)
        print(f"[*] 从 Gamma API 获取了 {len(markets)} 个市场")

        # 打印前几个市场的 token ID 用于验证
        for m in markets[:3]:
            print(f"  - {m['slug']}")
            print(f"    YES: {m['yes_token_id'][:30]}...")
            print(f"    NO:  {m['no_token_id'][:30]}...")

        async with AsyncSessionLocal() as session:
            count = await discovery.sync_markets_to_db(session, markets)
            print(f"[OK] 同步了 {count} 个新市场到数据库")
    finally:
        await discovery.close()
        await close_db()


async def run_fast_backfill(total: int = 10000):
    """运行快速回填 (使用 Polymarket Data API)"""
    backfill = FastBackfill()
    await backfill.backfill(total_trades=total)


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "serve":
            run_server()
        elif command == "refresh-profiles":
            asyncio.run(run_profiler_refresh())
        elif command == "scan-insider":
            asyncio.run(run_insider_scan())
        elif command == "ai-profile":
            # 支持参数: python -m src.main ai-profile [limit] [min_trades] [--force]
            limit = 50
            min_trades = 5
            force = False

            if len(sys.argv) > 2:
                try:
                    limit = int(sys.argv[2])
                except ValueError:
                    pass
            if len(sys.argv) > 3:
                try:
                    min_trades = int(sys.argv[3])
                except ValueError:
                    pass
            if "--force" in sys.argv:
                force = True

            asyncio.run(run_ai_profile_analysis(limit, min_trades, force))
        elif command == "backfill":
            # 支持指定月数: python -m src.main backfill 6
            months = 6
            if len(sys.argv) > 2:
                try:
                    months = int(sys.argv[2])
                except ValueError:
                    pass
            print(f"[BACKFILL] Starting {months} months historical data backfill...")
            asyncio.run(run_history_backfill(months))
        elif command == "sync-markets":
            asyncio.run(run_sync_markets())
        elif command == "fast-backfill":
            # 支持指定数量: python -m src.main fast-backfill 10000
            total = 10000
            if len(sys.argv) > 2:
                try:
                    total = int(sys.argv[2])
                except ValueError:
                    pass
            print(f"[FAST BACKFILL] Loading {total} trades (Polymarket Data API)...")
            asyncio.run(run_fast_backfill(total))
        else:
            print(f"未知命令: {command}")
            print("可用命令:")
            print("  serve                    - 启动 API 服务")
            print("  sync-markets             - 同步市场数据")
            print("  fast-backfill [数量]      - 快速回填交易 (推荐，默认 10000)")
            print("  backfill [月数]           - 链上回填历史数据 (慢)")
            print("  refresh-profiles         - 刷新交易者画像")
            print("  scan-insider             - 执行内幕分析扫描")
            print("  ai-profile [数量] [最小交易数] [--force] - AI交易者画像分析")
    else:
        run_server()
