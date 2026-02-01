# Nancy's Alpha - 南希严选

> 国会山望远镜 | Polymarket 政治预测市场链上大单监控与 AI 内幕分析系统

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/nancy-alpha)

## 项目概述

Nancy's Alpha 是一个实时监控 Polymarket 政治预测市场的 Web3 应用，通过链上数据分析和 AI 画像系统，帮助用户发现聪明钱动向和潜在内幕交易信号。

### 核心功能

- **🐋 巨鲸监控** - 实时追踪 >$10,000 的大单交易
- **🧠 AI 交易者画像** - 智能分析交易者行为模式和风险偏好
- **📊 市场情报** - 政治预测市场实时价格和趋势
- **🚨 内幕分析** - 结合新闻时间线的异常交易检测
- **💼 聪明钱追踪** - 高胜率交易者识别与跟单参考

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Nancy's Alpha                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐     ┌──────────────────────────────┐  │
│  │      Frontend        │     │         Backend              │  │
│  │   (Next.js 14)       │────▶│      (FastAPI + Python)      │  │
│  │                      │     │                              │  │
│  │  • Dashboard         │     │  • REST API                  │  │
│  │  • Markets View      │     │  • WebSocket (实时推送)       │  │
│  │  • Traders Profile   │     │  • AI Analyzer (Claude API)  │  │
│  │  • Whale Alerts      │     │  • Chain Listener            │  │
│  └──────────────────────┘     └──────────────────────────────┘  │
│           │                              │                       │
│           │                              │                       │
│           ▼                              ▼                       │
│  ┌──────────────────────┐     ┌──────────────────────────────┐  │
│  │   Vercel (前端)       │     │   Railway/Render (后端)      │  │
│  │   + Edge Functions   │     │   + PostgreSQL               │  │
│  └──────────────────────┘     └──────────────────────────────┘  │
│                                          │                       │
│                                          ▼                       │
│                              ┌──────────────────────────────┐   │
│                              │     External Services        │   │
│                              │  • Polygon RPC (链上数据)     │   │
│                              │  • Gamma API (市场元数据)     │   │
│                              │  • Claude API (AI分析)       │   │
│                              └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 技术栈

### Frontend
- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS + 赛博朋克主题
- **钱包**: RainbowKit + wagmi
- **图表**: Recharts
- **状态**: React Hooks + SWR

### Backend
- **框架**: FastAPI (Python 3.11+)
- **数据库**: PostgreSQL + SQLAlchemy (Async)
- **链上**: Web3.py + Polygon RPC
- **AI**: Anthropic Claude API
- **缓存**: 内存缓存 + 数据库

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/YOUR_USERNAME/nancy-alpha.git
cd nancy-alpha
```

### 2. 后端设置

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的配置

# 启动数据库 (Docker)
docker-compose up -d

# 同步市场数据
python -m src.main sync-markets

# 启动后端服务
python -m src.main serve
```

### 3. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 设置 NEXT_PUBLIC_API_URL=http://localhost:8000

# 启动开发服务器
npm run dev
```

### 4. 访问应用

- 前端: http://localhost:3000
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

## 环境变量

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/insider_hunter

# Blockchain
POLYGON_RPC_URL=https://polygon-rpc.com
CTF_EXCHANGE_ADDRESS=0x...

# APIs
GAMMA_API_URL=https://gamma-api.polymarket.com
ANTHROPIC_API_KEY=sk-ant-...

# Config
WHALE_THRESHOLD=10000
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

## 部署指南

### Vercel (前端)

1. Fork 本仓库
2. 在 Vercel 导入项目
3. 设置 Root Directory 为 `frontend`
4. 添加环境变量 `NEXT_PUBLIC_API_URL`
5. 部署

### Railway/Render (后端)

1. 创建 PostgreSQL 数据库
2. 部署 Python 应用
3. 设置环境变量
4. 配置启动命令: `python -m src.main serve`

## API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/whales/live` | GET | 实时巨鲸交易 |
| `/api/markets` | GET | 市场列表 |
| `/api/market/{slug}` | GET | 市场详情 |
| `/api/traders/leaderboard` | GET | 交易者排行榜 |
| `/api/trader/{address}` | GET | 交易者详情 |
| `/api/traders/{address}/ai-analyze` | POST | AI 画像分析 |
| `/api/insider/alerts` | GET | 内幕警报列表 |

## 项目结构

```
nancy-alpha/
├── frontend/                 # Next.js 前端
│   ├── app/                  # 页面路由
│   │   ├── dashboard/        # 仪表盘
│   │   ├── markets/          # 市场列表
│   │   └── traders/          # 交易者页面
│   ├── components/           # React 组件
│   ├── lib/                  # 工具库
│   │   ├── api/              # API 客户端
│   │   ├── utils.ts          # 工具函数
│   │   └── mock-data.ts      # 模拟数据
│   └── public/               # 静态资源
│
├── backend/                  # FastAPI 后端
│   ├── src/
│   │   ├── api/              # API 路由
│   │   ├── indexer/          # 链上监听
│   │   │   ├── listener.py   # 交易监听器
│   │   │   ├── discovery.py  # 市场发现
│   │   │   └── decoder.py    # 事件解码
│   │   ├── profiler/         # 画像分析
│   │   │   ├── analyzer.py   # 基础画像
│   │   │   └── ai_analyzer.py # AI 画像
│   │   ├── agent/            # 内幕分析
│   │   ├── models.py         # 数据模型
│   │   ├── db.py             # 数据库
│   │   └── main.py           # 入口
│   └── requirements.txt
│
└── docs/                     # 文档
    └── architecture.md
```

## 开发命令

```bash
# 后端
python -m src.main serve              # 启动 API 服务
python -m src.main sync-markets       # 同步市场数据
python -m src.main fast-backfill 5000 # 快速回填交易数据
python -m src.main ai-profile 50      # 批量 AI 分析

# 前端
npm run dev      # 开发模式
npm run build    # 生产构建
npm run lint     # 代码检查
```

## 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## 免责声明

本项目仅供教育和研究目的。不构成投资建议。预测市场存在风险，请谨慎参与。

## License

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**Made with ❤️ by the Nancy's Alpha Team**

*"The best insider trading is legal insider trading"* - Nancy P.
