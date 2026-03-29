# 中日经贸通 - 自动化运营配置

## 监控体系

### 1. UptimeRobot（网站可用性监控）

注册 [uptimerobot.com](https://uptimerobot.com)，添加以下监控项：

| 监控项 | URL | 检查频率 | 告警方式 |
|--------|-----|---------|---------|
| 首页 | https://your-domain.com | 5分钟 | 邮件 + 微信 |
| 商机页面 | https://your-domain.com/opportunities | 15分钟 | 邮件 |
| API 健康检查 | https://your-domain.com/api/health | 5分钟 | 邮件 + Slack |

**告警阈值：**
- 连续2次失败触发邮件告警
- 连续5次失败触发微信/Slack告警

### 2. Sentry（错误追踪）

在 `sentry.client.config.ts` 中配置：

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 3. Vercel Analytics（流量分析）

自动集成，无需额外配置。查看：https://vercel.com/analytics

### 4. Google Analytics 4

在 `src/app/layout.tsx` 的 `<head>` 中添加：

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 运营自动化

### 每周自动化报告

n8n 工作流：每周一早上 9:00 自动生成并发送周报。

**报告内容：**
1. 本周新增商机数量
2. 本周新增资讯数量
3. 热门商机 TOP 3
4. 贸易数据趋势摘要
5. 本周新增注册用户数
6. 订阅收入概览

### 邮件自动化（Resend / SendGrid）

| 触发条件 | 邮件内容 | 发送时间 |
|---------|---------|---------|
| 新商机发布 | 商机详情 + 申请链接 | 即时 |
| 每周商机快讯 | TOP 10 本周商机摘要 | 每周五 18:00 |
| 会员到期提醒 | 续费优惠 + 续费链接 | 到期前7天 |
| 数据采集异常 | 异常详情 + 解决建议 | 即时 |

### Stripe 订阅自动化

```typescript
// 订阅创建时
webhook.on('customer.subscription.created', async (event) => {
  // 1. 激活用户会员权限
  // 2. 发送欢迎邮件
  // 3. 更新数据库会员状态
});

// 订阅取消时
webhook.on('customer.subscription.deleted', async (event) => {
  // 1. 降级用户为免费版
  // 2. 发送挽留邮件（3天后）
});
```

---

## 运营 SOP（标准操作流程）

### 每日（< 5分钟）
- [ ] 检查 UptimeRobot 告警邮件（3秒）
- [ ] 查看 Vercel Analytics 流量报告（2分钟）
- [ ] 无异常则无需其他操作

### 每周（< 30分钟）
- [ ] 查看 n8n 工作流运行日志
- [ ] 审核 AI 生成的内容质量（随机抽查5条）
- [ ] 查看 Stripe 收入报告
- [ ] 处理用户反馈邮件

### 每月（< 2小时）
- [ ] 审核订阅转化率，优化定价策略
- [ ] 分析 Google Analytics 流量来源
- [ ] 更新数据源列表（检查链接是否有效）
- [ ] 备份 Notion 数据库内容

---

## 告警响应流程

```
告警触发（UptimeRobot/Sentry/n8n）
       │
       ▼
  判断严重程度
       │
  ┌────┴────┐
  │         │
  高优先级   低优先级
  (网站宕机)  (数据异常)
       │         │
       ▼         ▼
  立即处理     48小时内处理
       │
       ▼
  检查 Vercel 部署状态
       │
  ┌────┴────┐
  │         │
  部署正常   部署异常
  (网络问题)  (回滚版本)
       │
       ▼
  记录事件 → 更新 SOP
```

---

## 环境变量清单

```bash
# 数据库
NOTION_API_KEY=
NOTION_API_URL=https://api.notion.com/v1
NEWS_DATABASE_ID=
OPPORTUNITIES_DATABASE_ID=

# AI
OPENAI_API_KEY=          # 用于 AI 摘要生成
ANTHROPIC_API_KEY=       # 可选：Claude API

# 邮件
RESEND_API_KEY=          # 或 SENDGRID_API_KEY
NOTIFICATION_EMAIL=      # 管理通知邮箱

# 支付
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_PRO=
STRIPE_PRICE_ID_ENTERPRISE=

# 监控
SENTRY_DSN=
VERCEL_REVALIDATE_HOOK=  # Vercel ISR 重新生成 Webhook

# 错误工作流
ERROR_WORKFLOW_ID=       # n8n 错误处理工作流 ID
```
