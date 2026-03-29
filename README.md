# 中日经贸通 — China Japan Trade Platform

> 零维护、自动盈利的中日经贸信息聚合平台

[中文](#简体中文) · [日本語](#日本語) · [English](#english)

---

## 简体中文

### 项目概述

中日经贸通是一个基于 Next.js 14 + Tailwind CSS 构建的零维护自动化网站，集成了三层变现产品：

| 层级 | 产品 | 变现方式 | 自动化程度 |
|------|------|---------|-----------|
| 第一层 | 中日经贸资讯聚合 | Google AdSense 广告 | 100% 自动采集 |
| 第二层 | 贸易数据订阅 | Stripe 付费订阅 | 100% 自动收款 |
| 第三层 | B2B 商机匹配 | 会员费 + 成交佣金 | 半自动化（AI辅助） |

### 核心特性

- **三层产品结构**：资讯聚合 → 数据订阅 → 商机匹配，层层递进
- **全自动化内容采集**：GitHub Actions + Vercel Cron，完全替代 n8n，零成本
- **静态数据 + ISR**：JSON 文件存储，Vercel ISR 自动刷新页面
- **AI 智能客服**：7x24 小时在线，自动回答常见问题
- **订阅变现**：Stripe 自动化订阅，支持支付宝/微信/信用卡
- **零运维部署**：Vercel 托管，静态生成 + ISR，GitHub Actions CI/CD

### 零成本自动化方案

本项目**不使用 n8n**（免费版仅14天），改为更经济的方案：

| 组件 | 原方案（n8n） | 替代方案（零成本） |
|------|--------------|------------------|
| 定时数据采集 | n8n（付费） | **GitHub Actions**（免费无限次） |
| ISR 触发 | n8n Webhook | **Vercel Cron**（免费） |
| 数据存储 | Notion（付费） | **JSON 文件**（免费，存于 public/data/） |
| 数据获取 | Notion API | **Next.js fetch** + ISR（免费） |

### 快速开始

```bash
# 克隆项目
git clone https://github.com/qiangzhang2009/japan-trade.git
cd japan-trade

# 安装依赖
npm install

# 复制环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 API Keys（见下方配置说明）

# 启动开发服务器
npm run dev
# 访问 http://localhost:3000

# 构建生产版本
npm run build
```

### 环境变量配置

复制 `.env.example` 为 `.env.local`，需要配置以下关键变量：

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `NOTION_API_KEY` | 可选 | Notion 数据库（可选，不配置则只用 JSON 数据） |
| `OPENAI_API_KEY` | 可选 | AI 生成摘要（可选） |
| `STRIPE_SECRET_KEY` | 可选 | Stripe 收款（可选） |
| `VERCEL_REVALIDATE_HOOK` | 可选 | Vercel ISR 重新验证 Hook |
| `VERCEL_CRON_SECRET` | 推荐 | Cron 触发密钥（防被人随意触发） |
| `CRON_SECRET` | 推荐 | 同上，防止 Cron 接口被滥用 |
| `SENTRY_DSN` | 可选 | Sentry 错误监控（可选） |

### 项目结构

```
china-japan-trade/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── page.tsx           # 首页（Server Component，读取 JSON）
│   │   ├── news/               # 经贸资讯页面（Client Component，fetch JSON）
│   │   ├── data/               # 贸易数据页面
│   │   ├── opportunities/      # 商机广场页面
│   │   ├── pricing/            # 会员定价页面
│   │   └── api/cron/collect/   # Vercel Cron API 路由
│   ├── components/
│   │   ├── layout/             # 布局组件（导航、页脚）
│   │   ├── ads/                # 广告组件
│   │   └── chat/               # AI 客服机器人
│   ├── lib/
│   │   ├── utils.ts            # 工具函数
│   │   ├── mockData.ts         # 备用模拟数据
│   │   └── dataService.ts      # 数据服务（从 JSON / Notion 读取）
│   └── types/
│       └── index.ts             # TypeScript 类型定义
├── public/
│   └── data/                    # JSON 数据文件（GitHub Actions 自动更新）
│       ├── news.json            # 新闻数据
│       ├── trade-data.json      # 贸易数据
│       └── opportunities.json   # 商机数据
├── scripts/
│   └── collector.js             # 数据采集脚本（Node.js）
├── .github/workflows/
│   └── collect.yml              # GitHub Actions 定时采集工作流
├── docs/
│   ├── deployment.md            # 部署指南
│   └── automation-ops.md        # 运营自动化配置
├── public/                      # 静态资源
├── vercel.json                  # Vercel 配置（含 Cron 定时任务）
├── .env.example                 # 环境变量模板
└── package.json
```

### 自动化运营

- **数据采集**：GitHub Actions 每 6 小时自动运行 `scripts/collector.js`
- **Cron 触发**：Vercel Cron 每 6 小时触发 `/api/cron/collect`
- **内容更新**：GitHub Actions 检测到数据变更后自动提交 + 触发 Vercel ISR
- **监控告警**：UptimeRobot 监控网站可用性，Sentry 追踪运行时错误

### 部署

推荐使用 Vercel 部署（免费套餐即可支撑小型网站）：

```bash
# 方式一：Vercel CLI
npm i -g vercel
vercel --prod

# 方式二：GitHub 集成（推荐）
# Fork 本仓库 → Vercel Import → 自动部署
```

部署后需要在 Vercel 配置以下内容：
1. **环境变量**：在 Vercel Project Settings → Environment Variables 添加所有变量
2. **Cron Job**：在 vercel.json 中已配置，确保 Vercel 的 Cron 功能已启用
3. **GitHub Actions Secrets**：在 GitHub 仓库 Settings → Secrets 中添加：
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `NOTION_API_KEY`（可选）
   - `VERCEL_REVALIDATE_HOOK`

详细部署步骤见 [部署指南](docs/deployment.md)。

---

## 日本語

### プロジェクト概要

中日经贸通は、Next.js 14 + Tailwind CSS で構築されたメンテナンス不要の自動化ウェブサイトです。

**3層の収益化商品：**
- 第1層：中日经贸情報集約 → AdSense 広告収益
- 第2層：貿易データ購読 → Stripe 有料購読
- 第3層：B2B ビジネス情報マッチング → 会員料 + コミッション

**ゼロコスト自動化：**
- GitHub Actions でデータ収集（每小时、免费）
- Vercel Cron で ISR トリガー（免费）
- JSON ファイルでデータ存储（完全無料）

```bash
npm install
cp .env.example .env.local
npm run dev
```

---

## English

### Project Overview

A zero-maintenance, auto-monetizing China-Japan trade information platform built with Next.js 14 + Tailwind CSS.

**Three-tier monetization:**
- Layer 1: Trade news aggregation → Ad revenue (Google AdSense)
- Layer 2: Trade data subscription → Subscription revenue (Stripe)
- Layer 3: B2B opportunity matching → Membership + commission

**Zero-cost automation (no n8n required):**
- GitHub Actions for scheduled data collection (free, unlimited)
- Vercel Cron for ISR triggers (free)
- JSON files for data storage (free forever)

### Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
# Visit http://localhost:3000
```

---

## License

MIT — Built with zero-maintenance in mind.
