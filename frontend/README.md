# Poli - Political Prediction Market & Copy-Trading Platform

政治预测市场跟单平台 - 基于 Polygon 区块链的去中心化预测市场，帮助用户发现聪明钱交易者并进行跟单决策。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Polygon](https://img.shields.io/badge/Polygon-Mainnet-purple)

## 🌟 项目特性

### 核心功能

- 🏠 **Dashboard** - 市场总览，实时警报，热门市场，聪明钱榜单
- 📈 **Markets** - 市场列表，详情页，价格走势，订单簿分析
- 👥 **Traders** - 交易者发现，11种标签分类，AI智能点评
- ⭐ **Following** - 跟单管理，自动跟单配置
- 💰 **Web3 Integration** - 钱包连接，ERC20 代币交互，智能合约集成

### Web3 功能

- ✅ **钱包连接** - 支持 MetaMask, Coinbase Wallet, WalletConnect
- ✅ **Polygon 网络** - 主网和 Mumbai 测试网支持
- ✅ **USDC 支付** - 使用 USDC 进行下注和结算
- ✅ **智能合约** - 完整的预测市场合约实现
- ✅ **实时余额** - 自动显示钱包 USDC 余额
- ✅ **网络切换** - 自动提示切换到 Polygon 网络

## 🚀 快速开始

### 前端部署

#### 1. 克隆项目

```bash
git clone https://github.com/AxonKitty/Poli.git
cd Poli/poli-frontend
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# WalletConnect Project ID (可选)
# 从 https://cloud.walletconnect.com 获取
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

#### 4. 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

#### 5. 构建生产版本

```bash
npm run build
npm start
```

### 智能合约部署

详细说明请查看 [poli-contracts/README.md](../poli-contracts/README.md)

```bash
cd poli-contracts
npm install
cp .env.example .env
# 编辑 .env 填入私钥和 RPC URL
npm run deploy:mumbai  # 部署到测试网
```

## 📁 项目结构

```
Poli/
├── poli-frontend/              # Next.js 前端应用
│   ├── app/                    # Next.js App Router
│   │   ├── dashboard/          # Dashboard 页面
│   │   ├── markets/            # Markets 页面
│   │   ├── traders/            # Traders 页面
│   │   ├── following/          # Following 页面
│   │   └── layout.tsx          # 全局布局
│   ├── components/             # React 组件
│   │   ├── navigation.tsx      # 导航栏
│   │   ├── wallet-connect.tsx  # 钱包连接
│   │   ├── network-switcher.tsx # 网络切换
│   │   ├── bet-form.tsx        # 下注表单
│   │   └── ui/                 # UI 组件库
│   ├── lib/                    # 工具库
│   │   ├── contracts/          # 合约 ABI 和地址
│   │   ├── hooks/              # Web3 Hooks
│   │   ├── utils.ts            # 工具函数
│   │   ├── wagmi-config.ts     # Wagmi 配置
│   │   └── mock-data.ts        # 模拟数据
│   └── public/                 # 静态资源
│
└── poli-contracts/             # Solidity 智能合约
    ├── contracts/              # 合约源码
    │   └── PredictionMarket.sol
    ├── scripts/                # 部署脚本
    │   └── deploy.ts
    ├── test/                   # 合约测试
    └── hardhat.config.ts       # Hardhat 配置
```

## 🛠 技术栈

### 前端

- **Next.js 14** - React 框架 (App Router)
- **TypeScript** - 类型安全
- **TailwindCSS** - UI 样式
- **Wagmi v2** - Web3 React Hooks
- **Viem v2** - 以太坊交互库
- **RainbowKit** - 钱包连接 UI
- **Recharts** - 数据可视化
- **Zustand** - 状态管理
- **React Query** - 数据请求

### 智能合约

- **Solidity ^0.8.20** - 合约语言
- **Hardhat** - 开发框架
- **OpenZeppelin** - 安全合约库
- **TypeScript** - 类型安全

### 区块链

- **Polygon** - Layer 2 网络
- **USDC** - 稳定币支付
- **ERC20** - 代币标准

## 🔗 合约地址

### Polygon Mainnet (Chain ID: 137)

| 合约 | 地址 |
|------|------|
| PredictionMarket | `待部署` |
| USDC | `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` |
| USDT | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` |

### Mumbai Testnet (Chain ID: 80001)

| 合约 | 地址 |
|------|------|
| PredictionMarket | `待部署` |
| USDC (Testnet) | `0x0FA8781a83E46826621b3BC094Ea2A0212e71B23` |

## 📖 使用指南

### 连接钱包

1. 点击左侧导航栏底部的 "Connect Wallet" 按钮
2. 选择你的钱包（MetaMask 或 Coinbase Wallet）
3. 授权连接
4. 如果不在 Polygon 网络，会提示切换网络

### 下注流程

1. 浏览市场列表，选择感兴趣的市场
2. 点击进入市场详情页
3. 选择 YES 或 NO
4. 输入下注金额
5. 首次下注需要授权 USDC
6. 确认交易

### 查看持仓

1. 进入 "Following" 页面
2. 查看你的所有持仓
3. 市场结算后可以领取奖金

## 🌐 部署到 Vercel

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AxonKitty/Poli/tree/main/poli-frontend)

### 手动部署

1. Fork 本项目到你的 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量：
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
4. 部署

## 🔧 配置合约地址

部署合约后，更新前端配置：

编辑 `poli-frontend/lib/contracts/addresses.ts`：

```typescript
export const CONTRACTS = {
  polygon: {
    predictionMarket: '0xYourContractAddress', // 更新这里
    usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  },
  polygonMumbai: {
    predictionMarket: '0xYourTestnetAddress', // 更新这里
    usdc: '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23',
  },
}
```

## 📚 文档

- [Web3 功能使用指南](../docs/web3_usage_guide.md)
- [项目结构说明](../docs/project_structure.md)
- [智能合约文档](../poli-contracts/README.md)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📝 开发计划

### ✅ Phase 1 - 前端 + Web3 集成

- [x] 页面布局和导航
- [x] Dashboard 页面
- [x] Markets 页面
- [x] Traders 页面
- [x] Following 页面
- [x] 钱包连接（RainbowKit）
- [x] Polygon 网络支持
- [x] ERC20 代币交互
- [x] 智能合约集成

### 🚧 Phase 2 - 后端服务（进行中）

- [ ] Polygon 链上数据索引器
- [ ] PostgreSQL 数据库
- [ ] WebSocket 实时更新
- [ ] AI 点评生成（OpenAI API）
- [ ] 用户认证系统

### 📋 Phase 3 - 高级功能（计划中）

- [ ] 自动跟单执行
- [ ] 移动端适配
- [ ] 多语言支持
- [ ] 高级数据分析
- [ ] 社交功能

## ⚠️ 注意事项

- **测试网优先**：建议先在 Mumbai 测试网测试所有功能
- **私钥安全**：不要将私钥提交到 Git
- **Gas 费用**：Polygon 主网需要 MATIC 支付 Gas
- **合约审计**：主网部署前建议进行安全审计

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [Polygon 文档](https://docs.polygon.technology/)
- [Wagmi 文档](https://wagmi.sh/)
- [RainbowKit 文档](https://www.rainbowkit.com/)
- [Hardhat 文档](https://hardhat.org/)

## 👥 团队

- 开发者：[@AxonKitty](https://github.com/AxonKitty)

## 📧 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [提交 Issue](https://github.com/AxonKitty/Poli/issues)
- Email: <your-email@example.com>

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**
