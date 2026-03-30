# 出海通 AsiaBridge — 项目总结与可复用经验

> 创建日期：2026-03-30
> 项目 URL：https://japan-trade.vercel.app

---

## 一、项目核心架构

### 1.1 技术栈总览

| 层次 | 技术选型 | 选型理由 |
|------|---------|---------|
| 前端框架 | Next.js 14 App Router | 服务端渲染、SEO友好、API Routes 内置 |
| 语言 | TypeScript | 类型安全、IDE 支持好 |
| 样式 | Tailwind CSS | 原子化 CSS、开发效率高 |
| 字体加载 | `next/font/google` | 自动优化字体加载 (FOIT/FOUT)、内联 CSS 避免布局抖动 |
| UI 动画 | Framer Motion | 复杂的交互动画 |
| 表单验证 | React Hook Form + Zod | 类型安全的表单处理 |
| HTTP 客户端 | Axios (收集脚本) / SWR (客户端缓存) | 各取所长 |
| 认证 | JWT (jose) + bcryptjs | 无状态认证，支持 SSR |
| 数据库 | JSON 文件 (开发) / Upstash Redis (生产) | 低成本启动，后续可平滑升级 |
| 部署 | Vercel | Next.js 官方支持，Cron Jobs 内置 |
| 图标 | Lucide React | 一致的 SVG 图标集 |
| 样式工具 | clsx + tailwind-merge | 动态类名拼接 |

### 1.2 目录结构 (约定)

```
src/
├── app/                    # Next.js App Router 页面
│   ├── layout.tsx         # 根布局 (字体加载、AuthProvider)
│   ├── globals.css       # Tailwind 指令 + CSS 变量
│   ├── page.tsx         # 首页
│   ├── sitemap.ts        # SEO sitemap (动态 BASE_URL)
│   ├── robots.ts         # robots.txt
│   ├── opportunities/    # 商机相关页面
│   ├── countries/        # 国家详情页
│   ├── industries/       # 行业版块
│   ├── pricing/         # 会员定价
│   ├── login/           # 登录/注册
│   ├── dashboard/       # 会员中心
│   ├── admin/           # 管理后台 (layout + pages)
│   ├── api/             # API Routes
│   │   ├── auth/        # 认证相关 API
│   │   ├── admin/       # 管理 API
│   │   └── cron/        # 定时任务 API
│   └── (other pages: about, contact, privacy, terms)
├── components/
│   ├── layout/          # 布局组件 (Navbar, Footer, SiteLayout)
│   ├── chat/            # AI 聊天机器人
│   └── pricing/        # FAQ 组件
├── lib/                  # 核心业务逻辑
│   ├── auth.ts          # 用户 CRUD、密码哈希、角色管理
│   ├── session.ts       # JWT 创建/验证、权限系统
│   ├── dataService.ts   # 数据读取服务
│   ├── mockData.ts      # 开发期 mock 数据
│   └── utils.ts        # 工具函数
├── contexts/
│   └── AuthContext.tsx  # React 认证上下文
├── types/
│   └── index.ts        # 共享 TypeScript 类型
scripts/
├── collector.js         # 数据采集器 (1320+ 行)
├── cleanAndSeedData.js  # 数据清洗
├── test-feeds.js       # Feed 测试
└── debug-keywords.js   # 关键词调试
public/data/
├── countries.json       # 国家数据
├── opportunities.json  # 商机数据
└── users.json         # 用户数据 (开发环境)
```

---

## 二、关键架构模式与经验

### 2.1 认证系统 (JWT + Context)

**设计模式：**
```
Browser -> AuthContext (React Context) -> API Routes -> JWT Cookie
                                    -> auth.ts (密码验证) -> Redis/JSON
                                    -> session.ts (JWT 创建)
```

**核心文件：**
- `src/lib/session.ts` — JWT 创建/验证，使用 jose 库，7 天过期
- `src/lib/auth.ts` — 用户 CRUD，支持 Redis 和 JSON 文件双后端
- `src/contexts/AuthContext.tsx` — React Context，暴露 `user/loading/login/logout/register/refresh`
- `src/app/api/auth/` — 4 个 API 路由：login, logout, register, me

**重要经验：**
1. **不要在客户端存敏感数据** — 所有用户信息通过 API 获取，Context 只存"安全用户"（无 passwordHash）
2. **`safeUser()` 函数** — 从 AuthUser（服务端，有 passwordHash）转换到 User（客户端，无 passwordHash），类型安全
3. **环境变量管理员** — 生产环境可通过 `ADMIN_EMAIL/ADMIN_PASSWORD` 环境变量创建管理员，无需数据库
4. **角色权限表** — `session.ts` 中 `ROLE_PERMISSIONS` 对象清晰定义每个角色的权限

```typescript
// 权限定义模式（可复用于其他项目）
export const ROLE_PERMISSIONS = {
  admin: { canManageMembers: true, canViewAllOpportunities: true, ... },
  premium: { canViewAllOpportunities: true, canSubmitOpportunities: true, ... },
  member: { canSubmitOpportunities: true, ... },
  viewer: {},
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS.admin;
export function hasPermission(role: string, permission: Permission): boolean {
  return !!ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]?.[permission];
}
```

### 2.2 数据服务层

**双后端模式：开发用 JSON，生产用 Redis**

```typescript
// src/lib/auth.ts 中的模式
async function readDB(): Promise<UsersDB> {
  if (HAS_REDIS) return getRedisDB();
  return getLocalDB();
}
async function writeDB(db: UsersDB): Promise<void> {
  if (HAS_REDIS) await saveRedisDB(db);
  else await saveLocalDB(db);
}
```

**重要经验：**
- Redis 是可选依赖，通过 `HAS_REDIS` 检测，环境变量存在即启用
- `lazy init` 模式 — Redis 客户端不在模块顶层初始化，避免构建时错误
- 所有数据操作都是 async — 支持后续无缝迁移到真实数据库

### 2.3 Next.js App Router 最佳实践

**布局嵌套模式：**
```
RootLayout (AuthProvider)
  └── SiteLayout (Navbar + Footer + ChatBot)
        └── Page Components
```

**字体加载（关键修复）：**
```typescript
// ❌ 错误：@import 在 @tailwind 指令之后（CSS 层叠顺序错误）
@import url('fonts...');
@tailwind base; // 太晚了，@import 会被忽略

// ✅ 正确：用 next/font/google，CSS 变量方式
import { Inter, Noto_Sans_SC } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
// 在 HTML 上：<html className={`${inter.variable} ${notoSansSC.variable}`}>
// CSS 中：font-family: var(--font-inter), var(--font-noto-sans-sc), system-ui, sans-serif;
```

**动态路由防止静态生成：**
```typescript
// API Routes 必须加这两个 export，防止构建时尝试静态生成
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
```

**ISR 模式（数据页面）：**
```typescript
// src/app/opportunities/page.tsx
export const dynamic = 'force-dynamic'; // 始终服务端渲染
// 或在 dataService.ts 的 fetch 中使用 next revalidate
```

### 2.4 SEO 模式

```typescript
// src/app/sitemap.ts — 动态 sitemap
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
// 必须在 Vercel 项目环境变量中设置 NEXT_PUBLIC_BASE_URL
// 不能依赖 .env.local（Vercel 构建时不用 .env.local）

// src/app/robots.ts — robots.txt
// 关键：sitemap URL 必须与 NEXT_PUBLIC_BASE_URL 一致

// src/app/layout.tsx — metadata
export const metadata: Metadata = {
  title: { default: '...', template: '%s | 出海通' },
  openGraph: { type: 'website', locale: 'zh_CN', alternateLocale: 'en_US' },
  twitter: { card: 'summary_large_image' },
};
```

### 2.5 API 路由设计

**认证模式：**
```typescript
// 每个需要认证的 API 路由顶部检查
const session = await getSessionFromRequest(request);
if (!session || session.role !== 'admin') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

**安全的响应：**
```typescript
// 永远不要返回 passwordHash
const response = NextResponse.json({ user: safeUser(user) });
// safeUser 剥离 passwordHash，确保类型安全
```

**删除用户后清除 Cookie：**
```typescript
// src/app/api/auth/me/route.ts
if (!user || user.status === 'suspended') {
  const response = NextResponse.json({ user: null });
  response.cookies.set('session_cookie', '', { maxAge: 0 }); // 清除 Cookie
  return response;
}
```

### 2.6 Vercel 部署配置

**vercel.json 关键配置：**
```json
{
  "framework": "nextjs",
  "crons": [{ "path": "/api/cron/collect", "schedule": "0 2 * * *" }],
  // 注意：Hobby 账号每天最多 1 次，Pro 才支持每小时
}
```

**必须设置的 Vercel 环境变量：**
| 变量名 | 说明 |
|--------|------|
| `NEXT_PUBLIC_BASE_URL` | 网站生产 URL（用于 sitemap.xml、robots.txt）|
| `CRON_SECRET` | Cron API 路由鉴权密钥 |
| `UPSTASH_REDIS_REST_URL` | 生产用户数据库（可选）|
| `UPSTASH_REDIS_REST_TOKEN` | Redis 认证令牌（可选）|

**生产部署命令：**
```bash
npm run build
npx vercel --prod
```

---

## 三、数据采集系统架构

### 3.1 采集器设计 (`scripts/collector.js`)

**架构：**
- 26 个数据源（RSS feeds + HTML 页面）
- 多语言关键词匹配（中、日、韩、越、泰、印尼、英）
- 评分算法（bizKW + contextKW + industryKW）
- 去重（基于标题）
- 去噪（政治、娱乐、股票新闻过滤）
- 写盘到 `public/data/opportunities.json`

**数据源分类：**
1. **RSS/Atom feeds** — JETRO, J-CAST, NHK, VnExpress, DanTri, Straits Times 等
2. **政府门户 HTML 抓取** — KOTRA, BOI Thailand, MATRADE, BKPM Indonesia, METI, DPIIT India 等

**关键词系统：**
- 商业关键词（寻求、采购、投资、合资、代理、OEM...）
- 噪音过滤关键词（股价、票房、选举、选举...）
- 国家/地区关键词（城市名、经济走廊名称...）

**调度方式：**
- **开发**：手动 `node scripts/collector.js`
- **生产**：Vercel Cron Jobs 每日 02:00 UTC 触发 `/api/cron/collect`
- **流程**：cron API → spawn node collector.js → 写盘 → Vercel ISR 可选触发

**重要经验：**
1. cheerio/axios 是可选依赖 — `try/catch` 降级处理
2. 采集的数据直接写 `public/data/` 目录 — 无需 API 层，Next.js 直接读文件系统
3. `IS_DRY_RUN` 模式 — 测试时不影响生产数据
4. 评分 < 6 的商机不标记为 Premium — 控制质量门槛

---

## 四、UI/UX 设计系统

### 4.1 设计语言

**色彩体系（CSS 变量）：**
```css
:root {
  --background: #FAFAF8;
  --foreground: #1C1917;
  --primary: #2563eb;
  --accent-gold: #D97706;   /* CTA 按钮 */
  --accent-red: #DC2626;    /* 警告/危险 */
  --accent-green: #16A34A;  /* 成功 */
  --border: #e7e5e4;
}
```

**国家层级色彩：**
| 梯队 | 边框色 | 徽章色 |
|------|--------|--------|
| 高价值 (Tier 1) | amber-300/400 | amber-100/700 |
| 增长市场 (Tier 2) | stone-300/400 | stone-100/600 |
| 新兴前沿 (Tier 3) | orange-200/300 | orange-100/700 |

**商机类型色彩：**
| 类型 | 颜色 | 场景 |
|------|------|------|
| supply (供应) | blue | 我方供货 |
| demand (采购) | amber | 我方采购需求 |
| investment (投资) | purple | 投资项目 |
| cooperation (合作) | emerald | 合作洽谈 |

### 4.2 组件模式

**商机卡片 — Premium 视觉区分：**
```tsx
// Premium 卡片：金色边框 + 微光效果
border-amber-300 shadow-amber-100
// 内嵌渐变遮罩
bg-gradient-to-br from-amber-50/40 via-transparent to-orange-50/30
// CSS 动画（globals.css）
@keyframes premium-glow { from { opacity: 0.3 } to { opacity: 0.6 } }
```

**滚动到顶按钮：**
- `useState(false)` + `window.scrollY > 400` 判断可见性
- 淡入淡出动画（opacity transition）

**ChatBot（AI 助手）：**
- 固定按钮在右下角，点击展开聊天窗口
- 快捷问题按钮组（SUGGESTED_RESPONSES 字典匹配）
- TypingIndicator 模拟打字动画（3 个 bouncing dots）

---

## 五、常见问题与解决方案

### Q1: `Failed to fetch RSC payload` 浏览器控制台错误
**原因**：Next.js Link 组件 prefetch 在网络隔离环境（headless browser）中失败
**解决**：无问题。这是 Next.js 13+ App Router 的正常行为，会优雅降级到普通导航

### Q2: Google Fonts 不加载（字体没有生效）
**原因**：`@import url(...)` 写在 `@tailwind` 指令**之后**，CSS 层叠顺序导致 import 被忽略
**解决**：使用 `next/font/google` + CSS 变量方式

### Q3: 静态页面构建超时（`/api/cron/collect`）
**原因**：API 路由没有 `export const dynamic = 'force-dynamic'`，Next.js 尝试静态生成它
**解决**：
```typescript
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
```

### Q4: sitemap.xml 显示错误的 URL（`asiabridge.example`）
**原因**：`.env.local` 在 Vercel 构建时不被使用
**解决**：通过 `npx vercel env add` 设置项目级环境变量，然后重新部署

### Q5: Next.js build 报 TypeScript 错误（`Cannot find name 'AuthUser'`）
**原因**：模块间类型不匹配（auth.ts 定义了 AuthUser，AuthContext 定义了重复的类型）
**解决**：统一类型定义在 `src/types/index.ts`，各模块导入使用

### Q6: 采集脚本报错 `Error: No Upstash Redis credentials configured`
**原因**：`HAS_REDIS` 检测到环境变量但 Redis 连接失败
**解决**：采集脚本独立于 auth 系统，JSON 文件后端是主路径，Redis 是可选增强

---

## 六、项目可复用清单

### 6.1 认证系统（可直接复用）

**文件清单：**
```
src/lib/session.ts      — JWT 工具（createSession/verifySession/ROLE_PERMISSIONS/hasPermission）
src/lib/auth.ts        — 用户 CRUD（支持 JSON/Redis 双后端）
src/contexts/AuthContext.tsx — React Context（完整登录/注册/登出）
src/app/api/auth/       — 4 个 API 路由（login/logout/register/me）
```

**复用方法：**
1. 复制 `auth.ts` 和 `session.ts` 到新项目的 `src/lib/`
2. 复制 `AuthContext.tsx` 到 `src/contexts/`
3. 复制 API routes 到 `src/app/api/auth/`
4. 在 `src/types/index.ts` 定义 `UserRole`, `UserStatus`, `User` 类型
5. 在 `layout.tsx` 用 `<AuthProvider>` 包裹子组件

### 6.2 工具函数库（可直接复用）

**src/lib/utils.ts 中可复用的函数：**
- `cn()` — Tailwind 类名拼接（clsx + tailwind-merge）
- `formatDate/formatRelativeTime` — 日期格式化
- `formatCurrency` — 多币种货币格式化
- `getCountryLabel/getCountryFlag` — 国家代码映射表
- `getOpportunityTypeLabel/getCooperationTypeLabel` — 枚举值映射
- `getTierLabel/getTierColor` — 梯队标签和颜色

### 6.3 Tailwind 配色方案（可直接复用）

在 `tailwind.config.ts` 中定义的扩展色板：
- `primary` (blue-50 到 blue-900)
- `accent.red/orange/gold/green`
- 自定义动画：fade-in, slide-up, pulse-soft, gradient-shift

在 `globals.css` 中的 CSS 组件类：
- `.card-shadow` / `.card-shadow-hover`
- `.glass` (毛玻璃效果)
- `.gradient-border` (渐变边框)
- `.shimmer` (加载动画)
- `.animate-fade-in`

### 6.4 Vercel 配置模板

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "crons": [{ "path": "/api/cron/collect", "schedule": "0 2 * * *" }]
}
```

### 6.5 TypeScript 类型模板 (`src/types/index.ts`)

```typescript
export type UserRole = 'viewer' | 'member' | 'premium' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface User {
  id: string;
  email: string;
  companyName: string;
  contactName: string;
  phone: string;
  country: string;
  industry: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLogin: string;
  subscription: { planId: string; status: 'active' | 'cancelled' | 'expired' | 'none'; startDate: string; endDate: string; };
}
```

---

## 七、安全检查清单

- [x] 所有 API 路由有权限检查
- [x] 密码用 bcryptjs 哈希存储（cost factor 12）
- [x] JWT 使用 HS256 + 7 天过期
- [x] Cookie 设置 `httpOnly: true, secure: NODE_ENV==='production', sameSite: 'lax'`
- [x] cron API 有 CRON_SECRET 鉴权
- [x] `safeUser()` 永远不返回 passwordHash
- [x] 管理后台自删保护（不能删除/降级自己的账号）
- [x] 错误信息不泄露内部实现细节
- [x] X-Frame-Options/X-Content-Type-Options/Referrer-Policy headers
- [x] 禁止爬虫访问 `/api/` 和 `/_next/`

---

## 八、环境配置清单

### 开发环境
```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000
CRON_SECRET=dev-secret
```

### 生产环境 (Vercel)
```bash
NEXT_PUBLIC_BASE_URL=https://your-domain.com
CRON_SECRET=<openssl rand -hex 32>
UPSTASH_REDIS_REST_URL=<from upstash.com>
UPSTASH_REDIS_REST_TOKEN=<from upstash.com>
```

---

## 九、已解决的问题（本次优化）

| # | 问题 | 修复 |
|---|------|------|
| 1 | `@import` 在 `@tailwind` 之后导致字体不加载 | 改用 `next/font/google` + CSS 变量 |
| 2 | `zustand` 依赖安装了但未使用 | 从 package.json 移除 |
| 3 | AuthContext 定义了重复的 User 类型 | 统一从 `@/types` 导入 |
| 4 | login API 返回用户信息不完整 | 改用 `safeUser()` 返回完整信息 |
| 5 | 登录 API 没有设置 session cookie | 确认 cookie 设置正确 |
| 6 | cron 路由尝试静态生成导致构建超时 | 添加 `dynamic = 'force-dynamic'` |
| 7 | admin 页面 useEffect 缺少依赖 | 用 `useCallback` 包装 fetchMembers |
| 8 | Google Fonts 警告（用 `pages/_document` 方式） | 改用 `next/font/google` |
| 9 | 多个 placeholder 邮箱 `asiabridge.example` | 统一替换为 `consumer@zxqconsulting.com` |
| 10 | sitemap.xml URL 使用默认值 `asiabridge.example` | 添加 Vercel 项目环境变量 |
| 11 | vercel.json 有重复的 security headers | 移除（在 next.config.js 统一管理）|
| 12 | admin 页面有指向不存在路由的链接 | 修复为有效链接 |
| 13 | cron API 使用 Hardcoded fallback secret | 移除 fallback，强制要求环境变量 |
| 14 | cron API 在生产环境泄露 stderr | 生产环境隐藏详细错误信息 |

---

## 十、性能指标

| 页面 | 首次加载 JS | 渲染方式 |
|------|------------|---------|
| / (首页) | 111 kB | 静态 (○) |
| /opportunities | 123 kB | 动态 (ƒ) |
| /pricing | 112 kB | 静态 (○) |
| /dashboard | 107 kB | 静态 (○) |
| /login | 104 kB | 静态 (○) |
| /admin | 99.6 kB | 静态 (○) |
| /admin/members | 91.5 kB | 静态 (○) |
| Shared chunks | 87.3 kB | 共享 |
| **总计** | **~24 pages** | 0 TypeScript errors |

---

## 十一、本次审查优化（2026-03-30）

### 11.1 发现并修复的问题

| # | 问题 | 修复 |
|---|------|------|
| 1 | 商机详情页面包屑链接指向错误路由 | 从 `/opportunities/${country}` 修正为 `/countries/${country}` |
| 2 | `/countries/[country]` 页面缺少 SEO metadata | 添加 `generateMetadata()` 函数 |
| 3 | `/industries` 页面缺少 SEO metadata | 添加 `export const metadata` |
| 4 | `/contact` 页面 `use client` + metadata 混用 | 拆分为 `page.tsx` (Server Component) + `ContactClient.tsx` |
| 5 | 管理后台 logo 使用红色而非品牌蓝 | 修正为 `from-blue-900 to-blue-950` |

### 11.2 构建验证

- ✅ TypeScript 编译：0 错误
- ✅ ESLint 检查：0 warnings, 0 errors
- ✅ Next.js 构建：24 个路由，0 错误
- ✅ Vercel 生产部署：成功

### 11.3 本次未修复的已知事项

| # | 事项 | 说明 |
|---|------|------|
| 1 | 商机详情页「申请对接」按钮 | 预留 — 需要对接 CRM 或邮件系统 |
| 2 | 订阅支付流程 | 预留 — 需要 Stripe/支付宝集成 |
| 3 | ChatBot 回复为预设字典匹配 | 预留 — 后续可接入 LLM API |
| 4 | Redis 生产数据库 | 待配置 — 需要在 Vercel 添加 UPSTASH 环境变量 |

---

*本文档持续更新，供后续项目参考复用。*
