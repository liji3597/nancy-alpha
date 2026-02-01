# 演示说明

## 演示步骤

### 1. 启动后端服务

```bash
cd nancy-alpha

# 激活虚拟环境
source venv/bin/activate  # Windows: venv\Scripts\activate

# 启动 PostgreSQL
docker-compose up -d

# 同步市场数据
python -m src.main sync-markets

# 启动 API 服务
python -m src.main serve
```

### 2. 启动前端服务

```bash
cd src/frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 3. 访问应用

- 前端界面: http://localhost:3000
- API 文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/api/health

### 4. 功能演示

#### 4.1 仪表盘 (Dashboard)
访问 http://localhost:3000/dashboard 查看：
- 实时巨鲸交易滚动条
- 热门 Alpha 市场
- 国会山巨鲸（聪明钱排行 + AI 画像）
- 反向指标警报
- 市场情绪雷达

#### 4.2 巨鲸交易监控
```bash
curl http://localhost:8000/api/whales/live?limit=10
```

#### 4.3 AI 交易者画像
```bash
curl -X POST "http://localhost:8000/api/traders/0x63ce342161250d705dc0b16df89036c8e5f9ba9a/ai-analyze"
```

#### 4.4 市场数据
```bash
curl http://localhost:8000/api/markets?limit=5
```

## 预期输出

### 仪表盘页面
- 赛博朋克风格深色主题界面
- 顶部滚动条实时显示巨鲸交易警报
- 左侧显示热门政治预测市场
- 右侧显示聪明钱排行榜，附带 AI 分析评语（限30字）
- 底部显示市场情绪趋势图

### API 响应示例

#### 巨鲸交易 `/api/whales/live`
```json
{
  "total": 10,
  "data": [
    {
      "tx_hash": "0x111d69f801f26c4fff500c08f3aa2ed27ecccbc9250606d7d51b753202850bbd",
      "market_slug": "lol-c9-ly-2026-01-31",
      "maker": "0x58776759ee5c70a915138706a1308add8bc5d894",
      "side": "SELL",
      "outcome": "Cloud9",
      "price": 0.999,
      "size": 29850.74,
      "amount_usd": 29820.89,
      "timestamp": "2026-02-01T09:07:22"
    }
  ]
}
```

#### AI 画像分析 `/api/traders/{address}/ai-analyze`
```json
{
  "address": "0x63ce342161250d705dc0b16df89036c8e5f9ba9a",
  "label": "小额试探性交易者",
  "trading_style": "保守",
  "risk_preference": "低",
  "ai_analysis": "该交易者交易频次较高但单笔金额较小..."
}
```

## 截图

### 仪表盘主界面
![Dashboard](screenshots/dashboard.png)

### 巨鲸监控
![Whale Trades](screenshots/whale-trades.png)

### AI 交易者画像
![AI Profile](screenshots/ai-profile.png)

## 演示数据

### 示例市场
- Slug: `will-the-new-york-rangers-win-the-2026-nhl-stanley-cup`
- Condition ID: `0xa0c492acb221e77adbe84953fec4fc917e45e8b67121c1852d20e2fb9a29064f`

### 示例交易
- Tx Hash: `0x111d69f801f26c4fff500c08f3aa2ed27ecccbc9250606d7d51b753202850bbd`
- Amount: $29,820.89
- Side: SELL

### 示例交易者
- Address: `0x63ce342161250d705dc0b16df89036c8e5f9ba9a`
- Type: `dumb_money`
- Label: `小额试探性交易者`

## 链上数据验证

Polygonscan 验证交易：
```
https://polygonscan.com/tx/0x111d69f801f26c4fff500c08f3aa2ed27ecccbc9250606d7d51b753202850bbd
```

## 注意事项

1. 首次运行需要同步市场数据 (`python -m src.main sync-markets`)
2. AI 分析需要有效的 Anthropic API Key
3. 链上监听需要稳定的 Polygon RPC 连接
4. 前端默认连接 `http://localhost:8000`
