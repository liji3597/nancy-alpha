# Nancy's Alpha - 系统架构文档

## 整体架构图

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           Nancy's Alpha System                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐                              ┌─────────────────────────┐  │
│   │   User      │                              │    External Services    │  │
│   │   Browser   │                              │                         │  │
│   └──────┬──────┘                              │  ┌─────────────────┐    │  │
│          │                                     │  │  Polygon Chain  │    │  │
│          ▼                                     │  │  (RPC Node)     │    │  │
│   ┌─────────────────────────────────────┐      │  └────────┬────────┘    │  │
│   │         Frontend (Vercel)           │      │           │             │  │
│   │                                     │      │  ┌────────▼────────┐    │  │
│   │  ┌───────────┐  ┌───────────────┐   │      │  │  Gamma API      │    │  │
│   │  │ Dashboard │  │ Markets List  │   │      │  │  (Polymarket)   │    │  │
│   │  └───────────┘  └───────────────┘   │      │  └────────┬────────┘    │  │
│   │  ┌───────────┐  ┌───────────────┐   │      │           │             │  │
│   │  │ Traders   │  │ Whale Alerts  │   │      │  ┌────────▼────────┐    │  │
│   │  └───────────┘  └───────────────┘   │      │  │  Claude API     │    │  │
│   │                                     │      │  │  (AI Analysis)  │    │  │
│   │  Next.js 14 + Tailwind + RainbowKit │      │  └─────────────────┘    │  │
│   └──────────────────┬──────────────────┘      └─────────────────────────┘  │
│                      │                                      ▲               │
│                      │ REST API                             │               │
│                      ▼                                      │               │
│   ┌─────────────────────────────────────────────────────────┴─────────────┐ │
│   │                    Backend (Railway/Render)                            │ │
│   │                                                                        │ │
│   │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│   │  │                         FastAPI Server                           │  │ │
│   │  │                                                                  │  │ │
│   │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │  │ │
│   │  │  │  API Layer  │  │  Services   │  │     Background Tasks    │   │  │ │
│   │  │  │             │  │             │  │                         │   │  │ │
│   │  │  │ /whales     │  │ Profiler    │  │  Chain Listener         │   │  │ │
│   │  │  │ /markets    │  │ AI Analyzer │  │  Market Discovery       │   │  │ │
│   │  │  │ /traders    │  │ Insider     │  │  History Backfill       │   │  │ │
│   │  │  │ /insider    │  │ Detector    │  │                         │   │  │ │
│   │  │  └─────────────┘  └─────────────┘  └─────────────────────────┘   │  │ │
│   │  └──────────────────────────────────────────────────────────────────┘  │ │
│   │                                   │                                    │ │
│   │                                   ▼                                    │ │
│   │                    ┌──────────────────────────────┐                    │ │
│   │                    │     PostgreSQL Database      │                    │ │
│   │                    │                              │                    │ │
│   │                    │  • markets     (市场元数据)   │                    │ │
│   │                    │  • trades      (交易记录)     │                    │ │
│   │                    │  • trader_profiles (画像)    │                    │ │
│   │                    │  • insider_alerts (警报)     │                    │ │
│   │                    └──────────────────────────────┘                    │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

## 数据流图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Data Flow                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. 链上数据采集                                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐         │
│  │ Polygon RPC  │────▶│ Listener     │────▶│ Trade Parser     │         │
│  │ (OrderFilled)│     │ (轮询)        │     │ (解码事件)        │         │
│  └──────────────┘     └──────────────┘     └────────┬─────────┘         │
│                                                      │                   │
│                                                      ▼                   │
│  2. 市场匹配                                    ┌──────────────┐         │
│  ┌──────────────┐     ┌──────────────┐         │ Token Map    │         │
│  │ Gamma API    │────▶│ Discovery    │────────▶│ (token→市场)  │         │
│  │ (clobTokenIds)     │ (同步市场)    │         └───────┬──────┘         │
│  └──────────────┘     └──────────────┘                 │                │
│                                                        ▼                │
│  3. 数据存储                               ┌───────────────────┐        │
│                                            │   PostgreSQL      │        │
│                                            │   ┌───────────┐   │        │
│                                            │   │  trades   │   │        │
│                                            │   └─────┬─────┘   │        │
│                                            └─────────┼─────────┘        │
│                                                      │                  │
│  4. 画像分析                                         ▼                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐        │
│  │ Profiler     │────▶│ Stats Calc   │────▶│ TraderProfile    │        │
│  │ (聚合统计)    │     │ (胜率/ROI)    │     │ (存储画像)        │        │
│  └──────────────┘     └──────────────┘     └────────┬─────────┘        │
│                                                      │                  │
│  5. AI 增强                                          ▼                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐        │
│  │ Claude API   │◀────│ AI Profiler  │◀────│ Profile Request  │        │
│  │ (生成评语)    │     │ (构建Prompt) │     │ (前端触发)        │        │
│  └──────────────┘     └──────────────┘     └──────────────────┘        │
│                                                                         │
│  6. 前端展示                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐        │
│  │ React Hooks  │◀────│ API Client   │◀────│ REST Endpoints   │        │
│  │ (状态管理)    │     │ (Fetch)      │     │ (/api/...)       │        │
│  └──────────────┘     └──────────────┘     └──────────────────┘        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 模块说明

### Frontend 模块

| 模块 | 路径 | 功能 |
|------|------|------|
| Dashboard | `/app/dashboard` | 主仪表盘，显示统计、巨鲸、市场 |
| Markets | `/app/markets` | 市场列表和详情 |
| Traders | `/app/traders` | 交易者排行榜和画像 |
| API Client | `/lib/api` | 后端 API 封装和 Hooks |
| Adapter | `/lib/api/adapter.ts` | 数据格式转换 |

### Backend 模块

| 模块 | 路径 | 功能 |
|------|------|------|
| API Routes | `src/api/routes.py` | REST API 端点 |
| Listener | `src/indexer/listener.py` | 链上交易监听 |
| Discovery | `src/indexer/discovery.py` | 市场元数据同步 |
| Decoder | `src/indexer/decoder.py` | 事件日志解码 |
| Profiler | `src/profiler/analyzer.py` | 交易者统计分析 |
| AI Profiler | `src/profiler/ai_analyzer.py` | AI 画像生成 |
| Insider | `src/agent/insider.py` | 内幕交易分析 |

## 数据库模型

```sql
-- 市场表
CREATE TABLE markets (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    condition_id VARCHAR(66) NOT NULL,
    yes_token_id VARCHAR(100) NOT NULL,
    no_token_id VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'Politics',
    question TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE
);

-- 交易表
CREATE TABLE trades (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) NOT NULL,
    log_index INTEGER NOT NULL,
    block_number BIGINT NOT NULL,
    market_slug VARCHAR(255) NOT NULL,
    maker VARCHAR(42) NOT NULL,
    side VARCHAR(10) NOT NULL,  -- 'BUY' / 'SELL'
    outcome VARCHAR(50) NOT NULL,
    price NUMERIC(10,6) NOT NULL,
    size NUMERIC(20,6) NOT NULL,
    amount_usd NUMERIC(18,2) NOT NULL,
    is_whale BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP NOT NULL,
    UNIQUE(tx_hash, log_index)
);

-- 交易者画像表
CREATE TABLE trader_profiles (
    address VARCHAR(42) PRIMARY KEY,
    total_trades INTEGER DEFAULT 0,
    total_volume NUMERIC(20,2) DEFAULT 0,
    win_count INTEGER DEFAULT 0,
    loss_count INTEGER DEFAULT 0,
    win_rate NUMERIC(5,2) DEFAULT 0,
    trader_type VARCHAR(20),  -- 'smart_money' / 'dumb_money' / 'normal'
    label VARCHAR(100),        -- AI 生成标签
    trading_style VARCHAR(50),
    risk_preference VARCHAR(20),
    ai_analysis TEXT
);

-- 内幕警报表
CREATE TABLE insider_alerts (
    id SERIAL PRIMARY KEY,
    trade_id INTEGER REFERENCES trades(id),
    market_slug VARCHAR(255) NOT NULL,
    trader_address VARCHAR(42) NOT NULL,
    related_news TEXT,
    time_diff_minutes INTEGER,
    is_suspect BOOLEAN DEFAULT FALSE,
    confidence NUMERIC(3,2),
    reason TEXT
);
```

## 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Deployment                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐         ┌─────────────────────────┐    │
│  │     Vercel      │         │    Railway / Render     │    │
│  │   (Frontend)    │         │      (Backend)          │    │
│  │                 │  HTTPS  │                         │    │
│  │  next.js build  │◀───────▶│  FastAPI + Uvicorn      │    │
│  │  Edge Network   │         │  PostgreSQL Database    │    │
│  │                 │         │  Background Workers     │    │
│  └─────────────────┘         └─────────────────────────┘    │
│         │                              │                     │
│         │                              │                     │
│         ▼                              ▼                     │
│  ┌─────────────────┐         ┌─────────────────────────┐    │
│  │ CDN (Static)    │         │  External APIs          │    │
│  │ • JS bundles    │         │  • Polygon RPC          │    │
│  │ • CSS           │         │  • Gamma API            │    │
│  │ • Images        │         │  • Claude API           │    │
│  └─────────────────┘         └─────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 环境变量清单

### Backend

| 变量 | 必须 | 说明 |
|------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接串 |
| `POLYGON_RPC_URL` | ✅ | Polygon RPC 节点 |
| `CTF_EXCHANGE_ADDRESS` | ✅ | Polymarket 交易所合约地址 |
| `GAMMA_API_URL` | ✅ | Gamma API 地址 |
| `ANTHROPIC_API_KEY` | ✅ | Claude API 密钥 |
| `WHALE_THRESHOLD` | ❌ | 大单阈值，默认 10000 USD |

### Frontend

| 变量 | 必须 | 说明 |
|------|------|------|
| `NEXT_PUBLIC_API_URL` | ✅ | 后端 API 地址 |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | ❌ | WalletConnect 项目 ID |
