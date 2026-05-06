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

### 采集器架构 v14

系统采用多级采集架构：

| 模块 | 脚本 | 数据类型 | 采集频率 |
|------|------|---------|---------|
| 基础采集器 | `collector.js` | RSS + HTML（44个数据源，多维度增强评分） | 每小时 |
| 韩国招标 | `narajangteo.js` | g2b.go.kr 政府招标公告 | 每6小时 |
| 中国台湾招标 | `twtender.js` | web.pcc.gov.tw 政府采购 | 每6小时 |
| 越南FTA | `vnfta.js` | FTA关税 + 贸易促进数据 | 每日 |
| 贸易统计 | `tradestats.js` | OEC/WB 贸易参考数据 | 每日 |
| 全量调度 | `collect-all.js` | 统一调度所有模块 | 按需 |

### 运行采集器

```bash
# 基础采集（RSS+HTML，44个数据源）
node scripts/collector.js
node scripts/collector.js --dry-run
node scripts/collector.js --country=japan --limit=5

# 全量采集（所有模块串行运行）
node scripts/collect-all.js
node scripts/collect-all.js --dry-run
node scripts/collect-all.js --fast  # 并行模式，更快
node scripts/collect-all.js --module=narajangteo  # 只运行指定模块

# 单独模块
npm run collect:kr   # 韩国国家招标
npm run collect:tw    # 中国台湾政府采购
npm run collect:vn    # 越南FTA关税
npm run collect:stats # 贸易统计数据
```

### 当前支持的数据源（v14，共44个）

**TIER 1 — 高优先级**

| 来源 | 国家 | 类型 |
|------|------|------|
| JETRO 日本贸易振兴机构 (×3) | 日本 | RSS+HTML |
| Nara Jangteo 国家招标门户 | 韩国 | HTML (g2b.go.kr) |
| KOTRA 全球采购商数据库 | 韩国 | RSS |
| MOIT 越南工贸部 | 越南 | HTML |
| VietnamNet 经济版 | 越南 | RSS |
| DanTri 今日电子报 | 越南 | RSS |
| FTA 关税门户 (RCEP/AANZFTA/EVFTA) | 越南 | HTML |
| Straits Times | 新加坡 | RSS |
| ESG 企业发展局 | 新加坡 | HTML |
| MATRADE 对外贸易发展局 (×2) | 马来西亚 | HTML |

**TIER 2 — 中优先级**

| 来源 | 国家 | 类型 |
|------|------|------|
| BOI Thailand 投资促进委员会 | 泰国 | RSS |
| Bangkok Post | 泰国 | RSS |
| PEZA 经济特区 + 投资公告 | 菲律宾 | HTML |
| Philstar | 菲律宾 | RSS |
| BKPM 投资统筹机构 | 印尼 | HTML |
| Detik Finance | 印尼 | RSS |
| 中国台湾政府采购 (web.pcc.gov.tw) | 中国台湾 | HTML |

**TIER 3 — 参考级**

| 来源 | 国家 | 类型 |
|------|------|------|
| BOI Pakistan | 巴基斯坦 | HTML |
| MoneyControl India | 印度 | RSS |
| Livemint | 印度 | RSS |
| CCI Cambodia | 柬埔寨 | HTML |
| DICA Myanmar | 缅甸 | HTML |
| PCI Laos | 老挝 | HTML |

**泛亚洲 RSS**

| 来源 | 类型 |
|------|------|
| Nikkei Asia | RSS |
| Economist Asia | RSS |
| CNBC Asia Pacific | RSS |
| BBC World Asia | RSS |
| Mothership Singapore | RSS |
| Splash247 Maritime | RSS |

> 数据源会因目标网站政策变化而失效，建议定期运行 `--dry-run` 测试。

### HuggingFace 数据集

HuggingFace 提供多个与贸易/商机相关的免费数据集，可用于训练 NLP 商机关联分类模型：

```bash
# 采集 HuggingFace 数据集
node scripts/hfdatasets.js
node scripts/hfdatasets.js --dry-run
node scripts/hfdatasets.js --dataset=bid  # 只下载招标数据集

# 安装 Crawl4AI（可选，用于高级 HTML 解析）
pip install crawl4ai
python3 scripts/crawl4ai_scraper.py --dry-run
```

**集成的数据集：**

| 数据集 | 规模 | 用途 | 相关度 |
|--------|------|------|--------|
| Qiaowenshu/bid-announcement-zh-v1.0 | 2000条 | 训练中文商机关联分类模型 | ⭐⭐⭐ 高 |
| combatsolutions/tender_dataset | ~1000条 | 训练招标行业分类模型 | ⭐⭐ 中 |
| lyutovad/TradeNewsEventDedup | 17566对 | 过滤重复贸易新闻 | ⭐⭐ 中 |
| lyutovad/TradeNewsSum | 59000对 | 训练翻译/摘要模型 | ⭐ 低 |
| electricsheepasia/asia-economic-indicators-all | 10986条 | 贸易流向分析参考 | ⭐⭐ 中 |

### 定时采集（Linux/Mac crontab）

```bash
# 编辑 crontab
crontab -e

# 每6小时执行一次全量采集（推荐）
0 */6 * * * cd /path/to/中国日本经贸网站 && node scripts/collect-all.js >> logs/collect-all.log 2>&1

# 每小时执行基础采集 (v14 多维度增强评分)
0 * * * * cd /path/to/中国日本经贸网站 && node scripts/collector.js >> logs/collector.log 2>&1
```

### 定时采集（Vercel Cron）

1. 在 `vercel.json` 中配置 cron job（已预设）
2. 设置环境变量 `CRON_SECRET` 和 `VERCEL_REVALIDATE_HOOK`
3. 采集完成后自动触发 ISR 页面再生成

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
