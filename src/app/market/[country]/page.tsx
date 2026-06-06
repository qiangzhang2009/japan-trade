import Navbar from '@/components/Navbar';
import { COUNTRIES } from '@/lib/countries';
import Link from 'next/link';
import { ArrowLeft, Globe, Users, TrendingUp, Shield, CheckCircle } from 'lucide-react';

export async function generateStaticParams() {
  return COUNTRIES.map((c) => ({ country: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const c = COUNTRIES.find((x) => x.id === country);
  return {
    title: c ? `${c.nameZh}市场洞察 — 出海通` : '市场洞察 — 出海通',
    description: c?.summary,
  };
}

const INDUSTRY_DETAIL: Record<string, { title: string; barriers: string[]; opportunities: string[]; channels: string[]; regulations: string[] }> = {
  jp: {
    title: '日本汉方·大健康市场深度分析',
    barriers: ['PMDA认证门槛高，医药部外品注册周期12-24个月', '消费者对「中国制造」健康产品存在信任壁垒', '包装标签要求严格，日文强制'],
    opportunities: ['功能性表示食品制度窗口期——无需PMDA认证即可上市', '药食同源原料需求旺盛，中国产品价格优势明显', 'Tsundra等日企寻求中国ODM/OEM合作伙伴'],
    channels: ['药妆店（松本清、AIN药妆、鹤羽）', '汉方诊所与中医师', '健康食品电商（Amazon Japan、DHC）', '访日游客渠道（空港免税）'],
    regulations: ['PMDA（医药品医疗器械综合机构）', '消费者厅（功能性表示食品）', '食品卫生法（食品添加剂规格）', 'KHP（局方医药品原料规格）'],
  },
  kr: {
    title: '韩国韩方健康产品市场深度分析',
    barriers: ['MFDS（食品医药品安全处）注册要求严格', '韩国本土韩方产业保护政策', 'K-Beauty/K-Food竞争激烈'],
    opportunities: ['韩国原料药九成依赖进口——中国是最大供应国', '韩方制剂出口中国有潜力（韩方颗粒返销中国）', 'K-Food出口带动功能性食品全球扩张'],
    channels: ['韩方制药企业（参天堂、华丰制药等）', '韩国贸易协会KOTRA采购对接', '韩国电商平台（Coupang、Naver）'],
    regulations: ['MFDS（食品医药品安全处）', 'KHP（韩方医药品原料规格）', '食品标示标准'],
  },
  sg: {
    title: '新加坡中医药市场深度分析',
    barriers: ['HSA（卫生科学局）准入要求规范', '新加坡市场竞争激烈，定位需精准'],
    opportunities: ['东南亚唯一中医合法化国家', '华人占总人口76%，中医药接受度极高', '英语环境有助于品牌国际化'],
    channels: ['中医诊所（全岛约1000家）', '屈臣氏、Unity等连锁药房', '新加坡中华总商会贸易对接'],
    regulations: ['HSA（卫生科学局）', '新加坡中医管理委员会（TCMB）', '食品销售法'],
  },
  vn: {
    title: '越南医药健康产品市场深度分析',
    barriers: ['越南医药监管体系尚在完善', '越南盾汇率波动影响定价', '胡志明市与河内市场差异大'],
    opportunities: ['经济高速增长，健康消费升级', '华人商圈历史悠久，对中医药接受度高', '渠道进入成本低于其他东南亚国家'],
    channels: ['传统药材铺（河内36古街）', '西贡连锁药房（Pharmacity、Long Chau）', '胡志明市华人商会贸易对接'],
    regulations: ['越南卫生部（MOH）', '越南药品管理局（DAV）', '食品卫生局（食品安全局）'],
  },
};

export default async function MarketPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const c = COUNTRIES.find((x) => x.id === country);
  if (!c) return <div className="text-white p-20">市场未找到</div>;

  const detail = INDUSTRY_DETAIL[country] || {
    title: `${c.nameZh}市场深度分析`,
    barriers: ['各国市场准入规则存在差异', '需进行本地化合规适配', '文化差异带来营销挑战'],
    opportunities: ['中医药在当地华人圈有认知基础', '中国产品价格优势明显', 'RCEP贸易便利化持续推进'],
    channels: ['当地华人商会', '连锁药房渠道', '贸易促进机构对接'],
    regulations: ['当地药监部门认证', '食品卫生标准', '标签和包装要求'],
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0a0a0f] pt-20">
        {/* Hero */}
        <div className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-950 to-[#0a0a0f]" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(139,82,236,0.08) 0%, transparent 60%)' }} />
          <div className="relative z-10 max-w-5xl mx-auto px-4">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" /> 返回首页
            </Link>
            <div className="flex items-start gap-4 mb-6">
              <span className="text-5xl">{c.flag}</span>
              <div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-2">{c.nameZh}市场洞察</h1>
                <p className="text-gray-400">{c.nameEn}</p>
              </div>
            </div>
            <p className="text-xl text-gray-300 leading-relaxed mb-8 max-w-3xl">{c.description}</p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
              {[
                { label: 'GDP', value: c.gdp, icon: TrendingUp },
                { label: '人均GDP', value: c.gdpPerCapita, icon: Globe },
                { label: '人口', value: c.population, icon: Users },
                { label: '出海商机', value: `${c.opportunityCount}个`, icon: Shield },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.04] border border-white/5">
                  <stat.icon className="w-5 h-5 text-brand-400 shrink-0" />
                  <div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                    <div className="font-semibold text-white">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail Content */}
        <div className="max-w-5xl mx-auto px-4 pb-20 space-y-12">
          {/* Industries */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-1 h-6 rounded-full bg-brand-500" />
              重点行业
            </h2>
            <div className="flex flex-wrap gap-2">
              {c.mainIndustries.map((ind) => (
                <span key={ind} className="px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm">
                  {ind}
                </span>
              ))}
            </div>
          </section>

          {/* Opportunities */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-1 h-6 rounded-full bg-emerald-500" />
              市场机会
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {detail.opportunities.map((opp, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-300 leading-relaxed">{opp}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Barriers */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-1 h-6 rounded-full bg-amber-500" />
              准入壁垒
            </h2>
            <div className="space-y-3">
              {detail.barriers.map((b, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
                  <span className="text-amber-400 font-bold shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-sm text-gray-300 leading-relaxed">{b}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Channels */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-1 h-6 rounded-full bg-blue-500" />
              主要渠道
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {detail.channels.map((ch, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-2 h-2 rounded-full bg-brand-400 shrink-0" />
                  <span className="text-sm text-gray-300">{ch}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Regulations */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="w-1 h-6 rounded-full bg-purple-500" />
              监管机构
            </h2>
            <div className="flex flex-wrap gap-3">
              {detail.regulations.map((reg) => (
                <span key={reg} className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm">
                  {reg}
                </span>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-12 rounded-3xl bg-gradient-to-r from-brand-950 to-purple-950/50 border border-brand-500/20">
            <h3 className="text-2xl font-bold text-white mb-3">进入 {c.nameZh} 市场，从免费咨询开始</h3>
            <p className="text-gray-400 mb-8">15分钟内获得针对您产品的{c.nameZh}市场进入方案</p>
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-brand-600 text-white font-semibold hover:bg-brand-500 transition-all shadow-lg shadow-brand-700/30">
              立即获取免费咨询 <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
