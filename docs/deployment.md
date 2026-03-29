# 中日经贸通 - 部署指南

## 快速开始

### 前置要求

- Node.js 18.17+
- npm 或 yarn
- Vercel 账号（推荐）或任意 Node.js 托管平台
- n8n（自动化工作流，Docker 部署）
- Notion 账号（数据存储）
- Stripe 账号（订阅支付）
- Resend 或 SendGrid（邮件发送）

### 本地开发

```bash
# 克隆项目
git clone https://github.com/your-org/china-japan-trade.git
cd china-japan-trade

# 安装依赖
npm install

# 复制环境变量
cp .env.example .env.local
# 编辑 .env.local 填入必要的 API Keys

# 启动开发服务器
npm run dev
# 访问 http://localhost:3000
```

### 构建生产版本

```bash
npm run build
npm run start
```

---

## 部署到 Vercel（推荐）

### 一键部署

1. Fork 本仓库到 GitHub
2. 登录 [Vercel](https://vercel.com)，点击 "New Project"
3. 选择 Fork 的仓库
4. 在环境变量中填入所有必要的 `NEXT_PUBLIC_*` 和服务端变量
5. 点击 "Deploy"

### 手动部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署预览
vercel

# 部署生产
vercel --prod
```

---

## n8n 工作流部署

### Docker 部署

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=your-secure-password \
  -e WEBHOOK_URL=https://n8n.your-domain.com/ \
  n8nio/n8n
```

### 导入工作流

1. 打开 n8n 管理界面（http://localhost:5678 或 https://n8n.your-domain.com）
2. 点击左侧菜单 "Workflows" → "Import from File"
3. 选择 `n8n/workflows/cn-jp-trade-collection.json`
4. 配置环境变量（参考 `docs/automation-ops.md`）
5. 激活工作流

---

## 第三方服务配置

### Notion

1. 创建 Notion 账号并登录 [notion.so](https://notion.so)
2. 创建两个数据库：`News` 和 `Opportunities`
3. 在 [notion.so/my-integrations](https://www.notion.so/my-integrations) 创建集成
4. 将集成添加到数据库，获取 `NOTION_API_KEY` 和 `DATABASE_ID`

### Stripe

1. 注册 [Stripe](https://stripe.com)
2. 创建两个订阅产品：专业版（¥299/月）和企业版（¥999/月）
3. 配置 Webhook 端点（`/api/webhooks/stripe`）
4. 获取 `STRIPE_SECRET_KEY` 和 Price IDs

### Resend（邮件）

1. 注册 [Resend](https://resend.com)
2. 添加发件域名（需要 DNS 配置）
3. 创建 API Key

### Sentry（错误追踪）

1. 注册 [Sentry](https://sentry.io)
2. 创建项目，选择 Next.js
3. 复制 DSN 到环境变量

---

## 域名配置

### Vercel 域名绑定

1. 在 Vercel 项目 Settings → Domains 中添加域名
2. 按提示在 DNS 解析商添加记录
3. 等待 SSL 证书自动签发（约5分钟）

### 建议域名

- `cn-jp-trade.com` — 主域名
- `china-japan-trade.com` — 备选
- `中日经贸通.cn` — 中文域名

---

## CI/CD 自动化

每次推送到 `main` 分支时自动部署：

```
GitHub Push (main branch)
        │
        ▼
  Vercel 自动构建
        │
        ▼
  运行 npm run build
        │
        ├── 失败 → 通知 Slack/邮件
        │
        ▼
  部署到生产环境
        │
        ▼
  发送部署完成通知
```

如需更详细的 CI/CD 配置，参考 `.github/workflows/deploy.yml`。
