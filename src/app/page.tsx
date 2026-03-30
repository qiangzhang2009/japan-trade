import Link from 'next/link';
import SiteLayout from '@/components/layout/SiteLayout';
import { getCountries, getOpportunities } from '@/lib/dataService';
import { formatRelativeTime, getCountryFlag, getOpportunityTypeLabel, getCooperationTypeLabel, getTierLabel } from '@/lib/utils';

function tierBorderColor(tier: 1 | 2 | 3): string {
  if (tier === 1) return 'border-amber-300 hover:border-amber-400';
  if (tier === 2) return 'border-stone-300 hover:border-stone-400';
  return 'border-orange-200 hover:border-orange-300';
}

function tierBadgeColor(tier: 1 | 2 | 3): string {
  if (tier === 1) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (tier === 2) return 'bg-stone-100 text-stone-600 border-stone-200';
  return 'bg-orange-100 text-orange-700 border-orange-200';
}

async function HeroSection({ stats }: { stats: Awaited<ReturnType<typeof getSiteStats>> }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[500px] h-[500px] bg-blue-800/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-blue-700/20 rounded-full blur-3xl" />
        <div className="absolute top-20 left-1/3 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(blue-400 1px, transparent 1px), linear-gradient(90deg, blue-400 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-800/50 border border-blue-700/50 text-xs font-semibold text-blue-300 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            覆盖东南亚+东亚 13 个核心市场
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6">
            <span className="text-white">出海第一站</span>
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
              商机通亚洲
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-blue-200 leading-relaxed mb-8 max-w-2xl">
            帮助中国企业找到东南亚、东亚优质<strong className="text-white">海外客户</strong>、
            <strong className="text-white">代理商</strong>、
            <strong className="text-white">渠道商</strong>与合作伙伴。
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-bold text-blue-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-lg shadow-amber-400/20 hover:shadow-xl hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              浏览最新商机
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all hover:-translate-y-0.5 backdrop-blur-sm"
            >
              了解会员服务
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-white/10">
            {[
              { value: `${stats.activeCountriesCount}`, label: '覆盖国家', sub: '东南亚+东亚核心市场' },
              { value: `${stats.opportunitiesCount}+`, label: '活跃商机', sub: '实时更新' },
              { value: '24h', label: '平均更新频率', sub: '全天候自动化采集' },
              { value: '0', label: '出版审核', sub: '只做商机不搞新闻' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-blue-400 font-medium">{stat.label}</div>
                <div className="text-[10px] text-blue-500/60">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

async function CountryGrid({ countries, opportunities }: { countries: Awaited<ReturnType<typeof getCountries>>, opportunities: Awaited<ReturnType<typeof getOpportunities>> }) {
  const tier1 = countries.filter(c => c.tier === 1);
  const tier2 = countries.filter(c => c.tier === 2);
  const tier3 = countries.filter(c => c.tier === 3);

  const oppCountByCountry = opportunities.reduce((acc, o) => {
    acc[o.country] = (acc[o.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  function CountryCard({ country }: { country: (typeof countries)[0] }) {
    const oppCount = oppCountByCountry[country.id] || 0;
    return (
      <Link href={`/opportunities?country=${country.id}`} className="group block">
        <div className={`bg-white rounded-2xl border-2 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full ${tierBorderColor(country.tier)}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{country.flag}</span>
              <div>
                <h3 className="font-bold text-stone-900 group-hover:text-blue-800 transition-colors text-base">
                  {country.nameZh}
                </h3>
                <p className="text-xs text-stone-400">{country.nameEn}</p>
              </div>
            </div>
            <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full border ${tierBadgeColor(country.tier)}`}>
              {getTierLabel(country.tier)}
            </span>
          </div>

          <p className="text-sm text-stone-500 leading-relaxed mb-4 flex-1 line-clamp-2">
            {country.summary}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {country.mainIndustries.slice(0, 3).map(ind => (
              <span key={ind} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-stone-100 text-stone-500 border border-stone-200">
                {ind}
              </span>
            ))}
            {country.mainIndustries.length > 3 && (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-stone-100 text-stone-400">
                +{country.mainIndustries.length - 3}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            <span className="text-xs text-stone-400">
              {country.gdp && `GDP ${country.gdp}`}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              {oppCount} 个商机
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h2 className="text-2xl font-black text-stone-900 mb-2">全球市场版块</h2>
        <p className="text-sm text-stone-500">按影响力梯队划分，选择您的目标市场</p>
      </div>

      {/* Tier 1 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
          <h3 className="text-base font-bold text-stone-800">第一梯队 — 高价值市场</h3>
          <span className="text-xs text-stone-400">经济发达，合作需求旺盛，立即进入</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tier1.map(c => <CountryCard key={c.id} country={c} />)}
        </div>
      </div>

      {/* Tier 2 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-stone-400" />
          <h3 className="text-base font-bold text-stone-800">第二梯队 — 高速增长市场</h3>
          <span className="text-xs text-stone-400">快速成长，潜力巨大，提前布局</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tier2.map(c => <CountryCard key={c.id} country={c} />)}
        </div>
      </div>

      {/* Tier 3 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400" />
          <h3 className="text-base font-bold text-stone-800">第三梯队 — 新兴前沿市场</h3>
          <span className="text-xs text-stone-400">最后蓝海，先入为主，建立根据地</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {tier3.map(c => <CountryCard key={c.id} country={c} />)}
        </div>
      </div>
    </section>
  );
}

async function FeaturedOpportunities({ opportunities }: { opportunities: Awaited<ReturnType<typeof getOpportunities>> }) {
  const featured = opportunities.filter(o => o.isPremium && o.status === 'active').slice(0, 6);
  const recent = opportunities.filter(o => o.status === 'active').sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  ).slice(0, 5);

  function OppCard({ opp }: { opp: (typeof opportunities)[0] }) {
    return (
      <Link href={`/opportunities/${opp.id}`} className="group block">
        <div className={`bg-white rounded-xl border p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full ${opp.isPremium ? 'border-amber-200 shadow-amber-50' : 'border-stone-200'}`}>
          <div className="flex items-start justify-between mb-2 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border"
                style={{
                  backgroundColor: opp.type === 'demand' ? '#fef3c7' : opp.type === 'supply' ? '#dbeafe' : opp.type === 'investment' ? '#ede9fe' : '#d1fae5',
                  color: opp.type === 'demand' ? '#92400e' : opp.type === 'supply' ? '#1e40af' : opp.type === 'investment' ? '#5b21b6' : '#065f46',
                  borderColor: opp.type === 'demand' ? '#fde68a' : opp.type === 'supply' ? '#bfdbfe' : opp.type === 'investment' ? '#ddd6fe' : '#a7f3d0',
                }}>
                {getOpportunityTypeLabel(opp.type)}
              </span>
              {opp.cooperationType && (
                <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-stone-100 text-stone-500 border border-stone-200">
                  {getCooperationTypeLabel(opp.cooperationType)}
                </span>
              )}
            </div>
            <span className="text-xl flex-shrink-0">{getCountryFlag(opp.country)}</span>
          </div>

          <h4 className="font-bold text-stone-800 text-sm leading-snug mb-1.5 group-hover:text-blue-700 transition-colors line-clamp-2">
            {opp.title}
          </h4>

          <p className="text-xs text-stone-400 mb-2">
            {opp.regionLabel && <span className="mr-2">{opp.regionLabel}</span>}
            <span>{opp.industry}</span>
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            {opp.amount && (
              <span className="text-sm font-bold text-blue-700">{opp.amount}万 {opp.currency}</span>
            )}
            <span className="text-[10px] text-stone-400 ml-auto">
              {formatRelativeTime(opp.publishedAt)}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <section className="py-16 bg-white border-y border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-stone-900">精选商机</h2>
            <p className="text-sm text-stone-500 mt-1">来自亚洲各国企业的真实合作需求</p>
          </div>
          <Link
            href="/opportunities"
            className="text-sm font-medium text-blue-700 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            查看全部商机
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {featured.map(opp => <OppCard key={opp.id} opp={opp} />)}
        </div>

        {/* Recent sidebar */}
        <div className="bg-stone-50 rounded-2xl border border-stone-200 p-5">
          <h3 className="text-sm font-semibold text-stone-700 mb-4">最新发布</h3>
          <div className="space-y-3">
            {recent.map(opp => (
              <Link
                key={opp.id}
                href={`/opportunities/${opp.id}`}
                className="flex items-center gap-3 group"
              >
                <span className="text-base flex-shrink-0">{getCountryFlag(opp.country)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
                    {opp.title}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {opp.regionLabel && <span>{opp.regionLabel} · </span>}
                    {formatRelativeTime(opp.publishedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-900 via-blue-950 to-blue-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-72 h-72 border border-white rounded-full" />
        <div className="absolute bottom-10 right-10 w-96 h-96 border border-white rounded-full" />
      </div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
          立即开始您的出海之旅
        </h2>
        <p className="text-blue-300 text-lg mb-8 max-w-2xl mx-auto">
          免费浏览所有商机，升级专业版获得完整对接服务。
          <br />出海通 — 让您的第一步走得更稳。
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-blue-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-xl shadow-amber-400/20"
          >
            立即升级专业版
          </Link>
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white border border-white/30 hover:bg-white/10 rounded-xl transition-all"
          >
            免费浏览商机
          </Link>
        </div>
      </div>
    </section>
  );
}

async function getSiteStats() {
  const [countries, opportunities] = await Promise.all([
    getCountries(),
    getOpportunities(),
  ]);
  const activeCountries = new Set(opportunities.filter(o => o.status === 'active').map(o => o.country));
  return {
    activeCountriesCount: activeCountries.size,
    opportunitiesCount: opportunities.filter(o => o.status === 'active').length,
  };
}

export default async function HomePage() {
  const [countries, opportunities, stats] = await Promise.all([
    getCountries(),
    getOpportunities(),
    getSiteStats(),
  ]);

  return (
    <SiteLayout>
      <HeroSection stats={stats} />
      <CountryGrid countries={countries} opportunities={opportunities} />
      <FeaturedOpportunities opportunities={opportunities} />
      <CTASection />
    </SiteLayout>
  );
}
