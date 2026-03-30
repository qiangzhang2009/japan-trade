import type { Metadata } from 'next';
import Link from 'next/link';
import SiteLayout from '@/components/layout/SiteLayout';
import { getOpportunities, getCountries } from '@/lib/dataService';
import { getCountryFlag, getOpportunityTypeLabel } from '@/lib/utils';

export const metadata: Metadata = {
  title: '行业版块 | 出海通 AsiaBridge',
  description: '按行业分类浏览亚洲13国商机，覆盖半导体、医疗器械、工业自动化、家具制造等15大行业，快速找到您所在行业的出海机会。',
};

export const dynamic = 'force-dynamic';

const INDUSTRIES = [
  { id: 'semiconductor', label: '半导体/电子', icon: '💾', color: 'blue', desc: '半导体、集成电路、电子元器件、显示器件、光伏组件' },
  { id: 'automotive', label: '新能源汽车', icon: '🚗', color: 'emerald', desc: '电动汽车、动力电池、充电桩、汽车零部件' },
  { id: 'automation', label: '工业自动化', icon: '🤖', color: 'purple', desc: '工业机器人、自动化设备、传感器、PLC控制器' },
  { id: 'medical', label: '医疗器械', icon: '🏥', color: 'rose', desc: '医疗设备、制药、生物医药、医疗耗材' },
  { id: 'chemical', label: '化工材料', icon: '⚗️', color: 'amber', desc: '化工原料、新材料、特种钢材、聚合物' },
  { id: 'textile', label: '纺织服装', icon: '👔', color: 'orange', desc: '纺织面料、服装成衣、辅料配件、染整设备' },
  { id: 'furniture', label: '家具制造', icon: '🪑', color: 'yellow', desc: '板式家具、实木家具、金属家具、户外家具' },
  { id: 'agri-food', label: '食品农业', icon: '🌾', color: 'green', desc: '农产品加工、食品饮料、农机设备、种子化肥' },
  { id: 'finance', label: '金融服务', icon: '🏦', color: 'sky', desc: '跨境支付、保险、融资租赁、投资并购' },
  { id: 'energy', label: '能源电力', icon: '⚡', color: 'cyan', desc: '光伏、风电、水电、储能、输配电设备' },
  { id: 'it-software', label: 'IT/软件', icon: '💻', color: 'indigo', desc: '软件开发、系统集成、云服务、AI应用' },
  { id: 'logistics', label: '贸易/物流', icon: '🚢', color: 'teal', desc: '国际物流、跨境电商、仓储、清关服务' },
  { id: 'mining', label: '钢铁/金属', icon: '⛏️', color: 'stone', desc: '钢材、铜铝有色金属、矿产开采、金属加工' },
  { id: 'real-estate', label: '房地产/建筑', icon: '🏗️', color: 'slate', desc: '房地产开发、工程承包、建材供应、园区运营' },
  { id: 'edu', label: '教育培训', icon: '📚', color: 'red', desc: '国际教育、职业培训、人才服务、留学服务' },
];

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
  green: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  sky: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
  teal: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
  stone: 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200',
  red: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
};

export default async function IndustriesPage() {
  const [opportunities, countries] = await Promise.all([
    getOpportunities(),
    getCountries(),
  ]);

  // Group opportunities by industry
  const oppByIndustry = opportunities
    .filter(o => o.status === 'active')
    .reduce((acc, o) => {
      const ind = o.industry;
      if (!acc[ind]) acc[ind] = [];
      acc[ind].push(o);
      return acc;
    }, {} as Record<string, typeof opportunities>);

  const industryData = INDUSTRIES.map(ind => {
    const opps = oppByIndustry[ind.label] || [];
    const byCountry = opps.reduce((a, o) => {
      a[o.country] = (a[o.country] || 0) + 1;
      return a;
    }, {} as Record<string, number>);
    const topCountries = Object.entries(byCountry)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([c]) => c);
    return { ...ind, count: opps.length, topCountries };
  }).sort((a, b) => b.count - a.count);

  return (
    <SiteLayout>
      {/* Page Header */}
      <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-white mb-3 flex items-center gap-3">
            <span>🏭</span> 行业版块
          </h1>
          <p className="text-blue-200">
            按行业分类浏览亚洲各国商机，快速找到您所在行业的出海机会
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Industry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {industryData.map(ind => (
            <Link
              key={ind.id}
              href={`/opportunities?industry=${encodeURIComponent(ind.label)}`}
              className="group"
            >
              <div className={`rounded-xl border p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 h-full flex flex-col ${COLOR_MAP[ind.color]}`}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{ind.icon}</span>
                  <span className="text-2xl font-black text-stone-300 group-hover:text-stone-400 transition-colors">
                    {ind.count}
                  </span>
                </div>
                <h3 className="font-bold text-stone-900 mb-1.5">{ind.label}</h3>
                <p className="text-xs text-stone-500 mb-3 leading-relaxed">{ind.desc}</p>

                {/* Country distribution */}
                {ind.topCountries.length > 0 && (
                  <div className="mt-auto flex items-center gap-1.5 flex-wrap">
                    {ind.topCountries.map(country => {
                      const countryData = countries.find(c => c.id === country);
                      if (!countryData) return null;
                      return (
                        <span key={country} className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500 bg-white/70 px-1.5 py-0.5 rounded-full border border-stone-200">
                          <span>{countryData.flag}</span>
                          <span>{countryData.nameZh}</span>
                        </span>
                      );
                    })}
                    {ind.count > 3 && (
                      <span className="text-[10px] text-stone-400">+{ind.count - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Featured Opportunities by Industry */}
        <h2 className="text-xl font-black text-stone-900 mb-6">各行业精选商机</h2>
        <div className="space-y-6">
          {industryData.slice(0, 5).map(ind => {
            const opps = (oppByIndustry[ind.label] || []).slice(0, 3);
            if (opps.length === 0) return null;
            return (
              <div key={ind.id}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
                    <span>{ind.icon}</span>
                    <span>{ind.label}</span>
                    <span className="text-xs font-normal text-stone-400">({ind.count}个商机)</span>
                  </h3>
                  <Link
                    href={`/opportunities?industry=${encodeURIComponent(ind.label)}`}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    查看全部
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {opps.map(opp => {
                    const countryData = countries.find(c => c.id === opp.country);
                    return (
                      <Link key={opp.id} href={`/opportunities/${opp.id}`} className="group">
                        <div className="bg-white rounded-xl border border-stone-200 p-4 hover:shadow-md hover:border-blue-200 transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-lg">{countryData?.flag || '🌏'}</span>
                              <span className="text-[10px] text-stone-400">{getOpportunityTypeLabel(opp.type)}</span>
                            </div>
                            {opp.isPremium && (
                              <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-semibold">⭐优选</span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-stone-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2">
                            {opp.title}
                          </h4>
                          <p className="text-xs text-stone-400">
                            {opp.regionLabel && <span>{opp.regionLabel} · </span>}
                            {opp.companyName}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SiteLayout>
  );
}
