# Vercel 部署指南

## 🚀 快速部署

### 方法 1: 从 GitHub 导入（推荐）

1. **访问 Vercel**
   - 打开 <https://vercel.com/new>
   - 使用 GitHub 账号登录

2. **导入项目**
   - 选择你的 GitHub 仓库 `Poli`
   - 点击 "Import"

3. **配置项目**
   - **Framework Preset**: Next.js
   - **Root Directory**: 选择 `poli-frontend` ⚠️ **重要！**
   - **Build Command**: `npm run build` (自动检测)
   - **Output Directory**: `.next` (自动检测)
   - **Install Command**: `npm install` (自动检测)

4. **环境变量**

   点击 "Environment Variables"，添加：

   | Key | Value | Environment |
   |-----|-------|-------------|
   | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | `your_project_id` | Production, Preview, Development |

   > 💡 从 <https://cloud.walletconnect.com> 获取免费的 Project ID

5. **部署**
   - 点击 "Deploy"
   - 等待 2-3 分钟完成构建

6. **访问网站**
   - 部署成功后会显示 URL
   - 例如: `https://poli-xxx.vercel.app`

### 方法 2: 使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 进入前端目录
cd poli-frontend

# 部署
vercel --prod

# 按提示操作
# - Set up and deploy: Y
# - Which scope: 选择你的账号
# - Link to existing project: N
# - Project name: poli
# - Directory: ./
# - Override settings: N
```

## ⚙️ 环境变量配置

### 必需的环境变量

```env
# WalletConnect Project ID (可选，但推荐)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 获取 WalletConnect Project ID

1. 访问 <https://cloud.walletconnect.com>
2. 注册/登录账号
3. 创建新项目
4. 复制 Project ID
5. 在 Vercel 中添加环境变量

### 在 Vercel 中设置环境变量

**方法 A: 部署时设置**

- 在部署配置页面的 "Environment Variables" 部分添加

**方法 B: 部署后设置**

1. 进入项目 Dashboard
2. Settings → Environment Variables
3. 添加变量
4. 重新部署以应用更改

## 🔧 Vercel 项目设置

### 推荐设置

1. **General**
   - Node.js Version: `18.x` (推荐)
   - Framework Preset: Next.js

2. **Git**
   - Production Branch: `main`
   - ✅ Automatic deployments from Git
   - ✅ Deploy Previews (for Pull Requests)

3. **Domains**
   - 添加自定义域名（可选）
   - 默认域名: `poli-xxx.vercel.app`

4. **Functions**
   - Region: 选择离用户最近的区域
   - 推荐: `hnd1` (Tokyo) 或 `sin1` (Singapore) 对亚洲用户

## 📋 部署检查清单

### 部署前

- [ ] 代码已推送到 GitHub
- [ ] `.env.local` 已添加到 `.gitignore`
- [ ] 本地构建成功 (`npm run build`)
- [ ] 获取 WalletConnect Project ID

### 部署中

- [ ] Root Directory 设置为 `poli-frontend`
- [ ] 环境变量已配置
- [ ] 构建成功（无错误）

### 部署后

- [ ] 访问部署的 URL
- [ ] 测试钱包连接功能
- [ ] 测试网络切换
- [ ] 检查 USDC 余额显示
- [ ] 测试响应式布局
- [ ] 检查控制台无错误

## 🐛 常见问题

### 问题 1: 构建失败 - "Module not found"

**原因**: 依赖未正确安装

**解决**:

```bash
# 本地测试构建
cd poli-frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

如果本地成功，在 Vercel 中：

- Settings → General → Build & Development Settings
- 确认 Install Command: `npm install`

### 问题 2: 环境变量不生效

**原因**: 环境变量未正确配置或未重新部署

**解决**:

1. Settings → Environment Variables
2. 确认变量名以 `NEXT_PUBLIC_` 开头
3. 确认变量已添加到所有环境（Production, Preview, Development）
4. Deployments → 点击最新部署 → Redeploy

### 问题 3: 钱包连接失败

**原因**: WalletConnect Project ID 无效或未配置

**解决**:

1. 检查 Project ID 是否正确
2. 确认环境变量名为 `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
3. 重新部署

### 问题 4: 404 错误

**原因**: Root Directory 设置错误

**解决**:

1. Settings → General
2. Root Directory: `poli-frontend`
3. 保存并重新部署

### 问题 5: 构建超时

**原因**: 构建时间过长

**解决**:

- 升级到 Pro 计划（构建时间更长）
- 优化依赖（移除未使用的包）

## 🔄 自动部署

### Git 集成

Vercel 会自动：

- ✅ 从 `main` 分支部署到生产环境
- ✅ 从其他分支创建预览部署
- ✅ 为 Pull Request 创建预览

### 手动触发部署

**方法 A: Vercel Dashboard**

1. 进入项目
2. Deployments
3. 点击最新部署的 "..." 菜单
4. 选择 "Redeploy"

**方法 B: Git Push**

```bash
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

## 📊 监控和分析

### Vercel Analytics

1. 进入项目 Dashboard
2. Analytics 标签
3. 查看：
   - 页面访问量
   - 性能指标
   - Web Vitals

### 实时日志

1. Deployments → 选择部署
2. 点击 "View Function Logs"
3. 实时查看服务器日志

## 🌐 自定义域名

### 添加域名

1. Settings → Domains
2. 输入你的域名
3. 按提示配置 DNS

### DNS 配置

**A Record**:

```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAME Record** (推荐):

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## 🔐 安全建议

- ✅ 启用 HTTPS（Vercel 自动配置）
- ✅ 配置 CSP Headers
- ✅ 定期更新依赖
- ✅ 使用环境变量存储敏感信息
- ✅ 不要在代码中硬编码 API 密钥

## 📈 性能优化

### 推荐设置

1. **启用 Edge Functions**
   - 更快的响应时间
   - 更低的延迟

2. **图片优化**
   - 使用 Next.js Image 组件
   - 自动 WebP 转换

3. **缓存策略**
   - 静态资源自动缓存
   - API 路由配置缓存头

## 🆘 获取帮助

- **Vercel 文档**: <https://vercel.com/docs>
- **Next.js 文档**: <https://nextjs.org/docs>
- **Vercel 支持**: <https://vercel.com/support>
- **社区论坛**: <https://github.com/vercel/vercel/discussions>

## ✅ 部署成功后

1. **更新 README**
   - 添加部署 URL
   - 添加 Vercel 徽章

2. **测试功能**
   - 完整测试所有功能
   - 在不同设备上测试

3. **分享项目**
   - 社交媒体
   - 相关社区

---

**🎉 恭喜！你的项目已成功部署到 Vercel！**
