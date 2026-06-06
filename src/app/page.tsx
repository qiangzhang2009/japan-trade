import Link from 'next/link';
import { Globe, ArrowRight, TrendingUp, Users, Shield, Zap } from 'lucide-react';
import Navbar from '@/components/Navbar';

const STATS = [
  { value: '16+', label: '覆盖国家', icon: Globe },
  { value: '200+', label: '渠道合作伙伴', icon: Users },
  { value: '85+', label: '覆盖国家/地区', icon: TrendingUp },
  { value: '98%', label: '合规通过率', icon: Shield },
];

const SERVICES = [
  {
    icon: TrendingUp,
    title: '商机精准匹配',
    desc: '基于85个国家数据，AI识别最适合您产品的海外渠道商、代理商与合作伙伴',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Shield,
    title: '合规护航',
    desc: '覆盖各国药监政策、准入规则、认证要求，提前预警合规风险，避免进入误区',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Users,
    title: '渠道直通',
    desc: '跳过中间商，直接对接海外优质渠道商，建立长期稳定合作关系',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Zap,
    title: '快速落地',
    desc: '全流程一站式服务，从需求诊断到合同签订，平均周期缩短80%',
    color: 'from-amber-500 to-orange-500',
  },
];

const TIER1 = [
  { id: 'jp', name: '日本', flag: '🇯🇵', tier: 1 },
  { id: 'kr', name: '韩国', flag: '🇰🇷', tier: 1 },
  { id: 'sg', name: '新加坡', flag: '🇸🇬', tier: 1 },
  { id: 'vn', name: '越南', flag: '🇻🇳', tier: 1 },
];
const TIER2 = [
  { id: 'my', name: '马来西亚', flag: '🇲🇾', tier: 2 },
  { id: 'id', name: '印度尼西亚', flag: '🇮🇩', tier: 2 },
  { id: 'th', name: '泰国', flag: '🇹🇭', tier: 2 },
  { id: 'ph', name: '菲律宾', flag: '🇵🇭', tier: 2 },
];
const TIER3 = [
  { id: 'in', name: '印度', flag: '🇮🇳', tier: 3 },
  { id: 'lk', name: '斯里兰卡', flag: '🇱🇰', tier: 3 },
  { id: 'np', name: '尼泊尔', flag: '🇳🇵', tier: 3 },
  { id: 'pk', name: '巴基斯坦', flag: '🇵🇰', tier: 3 },
  { id: 'la', name: '老挝', flag: '🇱🇦', tier: 3 },
  { id: 'kh', name: '柬埔寨', flag: '🇰🇭', tier: 3 },
  { id: 'mm', name: '缅甸', flag: '🇲🇲', tier: 3 },
  { id: 'af', name: '阿富汗', flag: '🇦🇫', tier: 3 },
];

const TIER_BORDER: Record<number, string> = {
  1: 'border-gold-400',
  2: 'border-gray-400',
  3: 'border-amber-700',
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-[#0a0a0f] to-[#0f0a1e]" />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(139,82,236,0.12) 0%, transparent 60%), radial-gradient(circle at 70% 60%, rgba(59,130,246,0.08) 0%, transparent 60%)',
          }} />

          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />

          <div className="relative z-10 max-w-6xl mx-auto px-4 text-center pt-24">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm mb-8 animate-fade-up">
              <Zap className="w-3.5 h-3.5" />
              <span>已收录 <strong>200+</strong> 海外渠道商资源</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6 animate-fade-up stagger-1">
              出海第一站
              <br />
              <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                商机通亚洲
              </span>
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up stagger-2">
              汇聚东南亚+东亚优质商机，帮您精准找到海外代理商、渠道商与合作伙伴。<br />
              覆盖日本、韩国、新加坡、越南、马来西亚等<strong className="text-white">16个亚洲市场</strong>。
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up stagger-3">
              <Link
                href="/opportunities"
                className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold text-lg hover:from-brand-500 hover:to-brand-600 transition-all shadow-2xl shadow-brand-700/40"
              >
                浏览商机
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/15 text-white font-semibold text-lg hover:bg-white/5 transition-all"
              >
                免费咨询
              </Link>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
            <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
              <div className="w-1.5 h-2.5 bg-brand-400 rounded-full animate-bounce" />
            </div>
          </div>
        </section>

        {/* ── Stats ────────────────────────────────────────────────────── */}
        <section className="relative py-20 bg-gradient-to-b from-transparent to-brand-950/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {STATS.map((s, i) => (
                <div key={i} className="text-center p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-brand-500/20 transition-colors">
                  <s.icon className="w-6 h-6 text-brand-400 mx-auto mb-3" />
                  <div className="text-3xl font-extrabold text-white mb-1">{s.value}</div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Services ─────────────────────────────────────────────────── */}
        <section className="py-24 relative">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">为什么选择出海通</h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">我们不只是信息平台——从需求诊断到渠道落地，一站式解决中国企业出海亚洲的所有关键问题</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SERVICES.map((s, i) => (
                <div key={i} className="group p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-brand-500/20 transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <s.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Country Grid ──────────────────────────────────────────────── */}
        <section className="py-24 bg-gradient-to-b from-brand-950/30 to-transparent">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">覆盖亚洲核心市场</h2>
              <p className="text-gray-400 text-lg">按影响力梯队规划，优先进入高价值市场</p>
            </div>

            {/* Tier 1 */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gold-500/10 text-gold-400 border border-gold-500/20">第一梯队</span>
                <div className="h-px flex-1 bg-gradient-to-r from-gold-500/30 to-transparent" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TIER1.map((c) => (
                  <Link key={c.id} href={`/market/${c.id}`} className="group relative p-5 rounded-2xl bg-white/[0.04] border border-gold-500/20 hover:border-gold-400/60 transition-all hover:-translate-y-0.5">
                    <div className="text-3xl mb-2">{c.flag}</div>
                    <div className="font-semibold text-white group-hover:text-gold-400 transition-colors">{c.name}</div>
                    <div className="text-xs text-gray-500 mt-1">核心市场</div>
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Tier 2 */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">第二梯队</span>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-500/30 to-transparent" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TIER2.map((c) => (
                  <Link key={c.id} href={`/market/${c.id}`} className="group p-5 rounded-2xl bg-white/[0.04] border border-white/5 hover:border-white/20 transition-all hover:-translate-y-0.5">
                    <div className="text-3xl mb-2">{c.flag}</div>
                    <div className="font-semibold text-white group-hover:text-brand-300 transition-colors">{c.name}</div>
                    <div className="text-xs text-gray-500 mt-1">增长市场</div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Tier 3 */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-700/10 text-amber-600 border border-amber-700/20">第三梯队</span>
                <div className="h-px flex-1 bg-gradient-to-r from-amber-700/30 to-transparent" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                {TIER3.map((c) => (
                  <Link key={c.id} href={`/market/${c.id}`} className="group p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all text-center">
                    <div className="text-2xl mb-1">{c.flag}</div>
                    <div className="font-medium text-sm text-gray-300 group-hover:text-white transition-colors">{c.name}</div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="text-center mt-12">
              <Link href="/opportunities" className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 font-medium transition-colors">
                查看全部商机
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Why Now ───────────────────────────────────────────────────── */}
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">现在，是最好的入场时机</h2>
            <p className="text-gray-400 text-lg mb-12">
              亚洲大健康市场正在经历结构性增长，中国中医药企业出海正处于历史性窗口期。
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { title: '需求爆发', desc: '亚洲老龄化加速，天然健康产品需求年增15%+' },
                { title: '渠道空缺', desc: '优质中国供应商严重不足，先进入者将占据核心渠道' },
                { title: '政策利好', desc: 'RCEP深化实施，关税减免，贸易壁垒持续降低' },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-gradient-to-b from-brand-900/40 to-transparent border border-brand-500/10">
                  <div className="text-brand-400 font-bold text-2xl mb-3">0{i + 1}</div>
                  <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950 to-purple-950/50" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(139,82,236,0.15) 0%, transparent 70%)' }} />
          <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">准备好开启您的出海之旅了吗？</h2>
            <p className="text-gray-300 text-lg mb-8">免费咨询，15分钟内给出初步市场评估和进入建议</p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-white text-brand-800 font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl"
            >
              立即免费咨询
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-sm text-gray-500">无需注册，留下联系方式即可获得专业顾问对接</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/40">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">出海通 AsiaBridge</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">上海张小强企业咨询事务所出品<br />专注中国企业出海亚洲市场</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">快速链接</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                {[['商机广场', '/opportunities'], ['市场洞察', '/market/jp'], ['关于我们', '/about'], ['联系我们', '/contact']].map(([label, href]) => (
                  <li key={href}><Link href={href} className="hover:text-brand-400 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">核心市场</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                {[['日本', '/market/jp'], ['韩国', '/market/kr'], ['新加坡', '/market/sg'], ['越南', '/market/vn']].map(([label, href]) => (
                  <li key={href}><Link href={href} className="hover:text-brand-400 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center text-sm text-gray-600">
            © 2026 出海通 AsiaBridge · 上海张小强企业咨询事务所 · 沪ICP备XXXXXXXX号
          </div>
        </div>
      </footer>
    </>
  );
}
