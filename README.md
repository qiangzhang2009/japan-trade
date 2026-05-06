# 出海通 AsiaBridge

帮助中国企业找到东南亚、东亚最优质的海外合作伙伴。汇聚13国真实商机，解决出海信息不对称的核心痛点。

## 产品特性

- **商机广场** — 按国家/地区、行业分类的商业机会浏览与筛选
- **国家详情** — 13个亚洲目标市场的深度介绍与商机分布
- **行业版块** — 16个行业领域的商机聚合与对比
- **自动数据采集** — 每日从JETRO、VietnamNet等主流经贸门户实时抓取商机
- **会员服务** — 免费/专业/企业三个等级，匹配不同规模企业需求

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **数据存储**: JSON 文件 (`public/data/`)
- **数据采集**: Node.js 脚本 + RSS 聚合
- **部署**: Vercel (Node.js)

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 数据采集

### 运行采集器

```bash
# 全量采集（抓取所有数据源）
node scripts/collector.js

# 预览模式（不写入文件）
node scripts/collector.js --dry-run

# 仅采集特定国家
node scripts/collector.js --country=vietnam
```

### 定时采集（Linux/Mac crontab）

```bash
# 编辑 crontab
crontab -e

# 每6小时执行一次（推荐）
0 */6 * * * cd /path/to/中国日本经贸网站 && node scripts/collector.js >> logs/collector.log 2>&1

# 每天凌晨2点执行
0 2 * * * cd /path/to/中国日本经贸网站 && node scripts/collector.js >> logs/collector.log 2>&1
```

### 定时采集（Vercel Cron）

1. 在 `vercel.json` 中配置 cron job（已预设）
2. 设置环境变量 `CRON_SECRET` 和 `VERCEL_REVALIDATE_HOOK`
3. 采集完成后自动触发 ISR 页面再生成

### 当前支持的数据源（2026-03 实测可用）

| 来源 | 国家 | 频率 |
|------|------|------|
| JETRO 日本贸易振兴机构 | 日本 | 实时 |
| VietnamNet 经济版 | 越南 | 活跃 |
| DanTri 今日电子报 | 越南 | 活跃 |
| MoneyControl India | 印度 | 每日 |
| The Star Malaysia | 马来西亚 | 每日 |
| Bangkok Post | 泰国 | 每日 |
| BBC World Asia | 泛亚洲 | 每日 |

> 数据源会因目标网站政策变化而失效，建议定期运行 `--dry-run` 测试。

## 环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

关键变量说明：

| 变量 | 必填 | 说明 |
|------|------|------|
| `NEXT_PUBLIC_BASE_URL` | 是 | 网站基础 URL（用于 sitemap） |
| `CRON_SECRET` | 是（生产） | API 路由鉴权密钥 |
| `VERCEL_REVALIDATE_HOOK` | 否 | Vercel ISR 重新生成 Webhook |

## 部署到 Vercel

```bash
# 安装 Vercel CLI（如尚未安装）
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产环境部署
vercel --prod
```

## 项目结构

```
src/
├── app/
│   ├── opportunities/       # 商机广场（首页）
│   ├── countries/          # 国家详情页
│   ├── industries/         # 行业版块
│   ├── pricing/            # 会员定价
│   ├── about/              # 关于我们
│   ├── contact/            # 联系我们
│   └── api/                # API 路由
│       ├── opportunities/  # 商机提交 API
│       └── cron/collect/   # 定时采集触发 API
├── components/
│   ├── layout/             # 布局组件（Header, Footer, SiteLayout）
│   └── opportunities/       # 商机相关组件
├── lib/
│   ├── dataService.ts      # 数据读写服务（从 public/data/*.json 读取）
│   └── utils.ts            # 工具函数
├── types/
│   └── index.ts            # TypeScript 类型定义
└── app/globals.css        # 全局样式
public/
├── data/
│   ├── opportunities.json  # 商机数据（自动更新）
│   └── countries.json      # 国家数据
scripts/
├── collector.js            # 数据采集脚本
└── test-feeds.js          # RSS 源测试工具
```

## 添加新国家/地区

1. 在 `scripts/collector.js` 的 `RSS_SOURCES` 数组中添加新的 RSS 源配置
2. 在 `public/data/countries.json` 中添加国家信息
3. 在 `src/app/sitemap.ts` 中添加国家页 sitemap 条目
4. 运行 `node scripts/collector.js --dry-run` 测试新数据源

## License

Private — All rights reserved.
