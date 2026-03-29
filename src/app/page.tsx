import Link from 'next/link';
import SiteLayout from '@/components/layout/SiteLayout';
import { getNews, getTradeData, getOpportunities } from '@/lib/dataService';
import { formatRelativeTime, getCategoryLabel, getTrendColor, getTrendIcon, getOpportunityTypeLabel, formatCurrency } from '@/lib/utils';

async function HeroSection() {
  const [news, opportunities] = await Promise.all([getNews(), getOpportunities()]);
  const totalTradeValue = 3847; // 亿美元
  const activeOpps = opportunities.filter((o) => o.status === 'active').length;

  return (
    <section className="hero-gradient relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-amber-50 rounded-full opacity-20 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-600 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse-soft" />
            数据实时更新 · 数据来源JETRO & 商务部
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6">
            <span className="text-stone-900">中日经贸</span>
            <br />
            <span className="gradient-text">一站式</span>
            <span className="text-stone-900"> 门户</span>
          </h1>

          <p className="text-lg sm:text-xl text-stone-600 leading-relaxed mb-8 max-w-2xl">
            聚合中日双边贸易资讯、政策动态、海关数据与实时商机，
            帮助贸易从业者、企业决策者和投资人{' '}
            <strong className="text-stone-800">第一时间发现机会</strong>。
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href="/opportunities"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-200 hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              浏览最新商机
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-all hover:-translate-y-0.5"
            >
              升级专业版
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-stone-200/60">
            {[
              { value: `${totalTradeValue}亿+`, label: '双边贸易额（美元）', sub: '2025年最新' },
              { value: `${activeOpps}+`, label: '活跃商机', sub: '实时更新' },
              { value: `${news.length}+`, label: '经贸资讯', sub: '每日采集' },
              { value: '12h', label: '平均更新频率', sub: '全天候自动化' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-black text-stone-900">{stat.value}</div>
                <div className="text-xs text-stone-500 font-medium">{stat.label}</div>
                <div className="text-[10px] text-stone-400">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

async function FeaturedNews() {
  const allNews = await getNews();
  const featured = allNews.filter((n) => n.isFeatured).slice(0, 2);
  const recent = allNews.filter((n) => !n.isFeatured).slice(0, 5);

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">经贸资讯</h2>
          <p className="text-sm text-stone-500 mt-1">中日内贸动态，实时更新</p>
        </div>
        <Link
          href="/news"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          查看全部
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Featured Articles */}
        {featured.map((article, i) => (
          <article
            key={article.id}
            className={`group ${i === 0 ? 'lg:col-span-2' : 'lg:col-span-1'}`}
          >
            <Link href={`/news/${article.id}`} className="block h-full">
              <div className={`bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex ${i === 0 ? 'flex-col sm:flex-row' : 'flex-col'}`}>
                {/* Image placeholder */}
                <div className={`bg-gradient-to-br from-blue-100 via-purple-50 to-amber-50 flex items-center justify-center ${i === 0 ? 'sm:w-2/5 min-h-48' : 'h-40'}`}>
                  <div className="text-center">
                    <div className="text-4xl font-black text-blue-200">{getCategoryLabel(article.category)[0]}</div>
                  </div>
                </div>
                <div className={`p-5 flex flex-col justify-between ${i === 0 ? 'sm:w-3/5' : ''}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                        {getCategoryLabel(article.category)}
                      </span>
                      <span className="text-[11px] text-stone-400">{article.source}</span>
                    </div>
                    <h3 className={`font-bold text-stone-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors ${i === 0 ? 'text-lg' : 'text-base'}`}>
                      {article.title}
                    </h3>
                    <p className="text-sm text-stone-500 leading-relaxed line-clamp-2 sm:line-clamp-3">
                      {article.summary}
                    </p>
                  </div>
                  <div className="mt-3 text-xs text-stone-400">
                    {formatRelativeTime(article.publishedAt)}
                  </div>
                </div>
              </div>
            </Link>
          </article>
        ))}

        {/* News List */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="text-sm font-semibold text-stone-700 mb-4">最新动态</h3>
          <div className="space-y-4">
            {recent.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.id}`}
                className="flex items-start gap-3 group"
              >
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 group-hover:bg-blue-600 transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                    {article.title}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {formatRelativeTime(article.publishedAt)}
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

async function TradeDataPreview() {
  const tradeData = await getTradeData();
  const topItems = tradeData.slice(0, 4);
  return (
    <section className="py-16 bg-white border-y border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-stone-900">贸易数据</h2>
            <p className="text-sm text-stone-500 mt-1">2026年2月海关进出口统计</p>
          </div>
          <Link
            href="/data"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            查看完整数据
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topItems.map((item) => (
            <div
              key={item.id}
              className="bg-stone-50 rounded-xl border border-stone-200 p-4 hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                    HS {item.hsCode}
                  </span>
                  <h4 className="text-sm font-semibold text-stone-800 mt-2 leading-snug group-hover:text-blue-600 transition-colors">
                    {item.productName}
                  </h4>
                  <p className="text-xs text-stone-400 mt-0.5">{item.productNameJp}</p>
                </div>
                <div className={`text-lg font-black ${getTrendColor(item.trend)}`}>
                  {getTrendIcon(item.trend)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-stone-400 mb-0.5">中国出口</p>
                  <p className="text-sm font-bold text-stone-800">{formatCurrency(item.cnExport, 'USD')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-400 mb-0.5">日本出口</p>
                  <p className="text-sm font-bold text-stone-800">{formatCurrency(item.jpExport, 'USD')}</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-1">
                <span className={`text-xs font-semibold ${item.trend === 'up' ? 'text-emerald-600' : item.trend === 'down' ? 'text-red-500' : 'text-stone-500'}`}>
                  {item.trend === 'up' ? '+' : ''}{item.trendPercent}%
                </span>
                <span className="text-xs text-stone-400">环比</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function OpportunitiesPreview() {
  const allOpps = await getOpportunities();
  const opportunities = allOpps.filter((o) => o.isPremium && o.status === 'active').slice(0, 3);

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">精选商机</h2>
          <p className="text-sm text-stone-500 mt-1">中日双边贸易合作机会</p>
        </div>
        <Link
          href="/opportunities"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          查看全部商机
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {opportunities.map((opp) => (
          <article key={opp.id} className="group">
            <Link href={`/opportunities/${opp.id}`}>
              <div className="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-lg hover:border-blue-200 transition-all h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                      {getOpportunityTypeLabel(opp.type)}
                    </span>
                    {opp.isPremium && (
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                        优选
                      </span>
                    )}
                  </div>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                    {opp.country === 'cn' ? '中国' : opp.country === 'jp' ? '日本' : '中日'}
                  </span>
                </div>

                <h3 className="font-bold text-stone-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors">
                  {opp.title}
                </h3>

                <p className="text-sm text-stone-500 leading-relaxed line-clamp-3 flex-1">
                  {opp.description}
                </p>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-400">{opp.industry}</p>
                    <p className="text-sm font-semibold text-stone-700">{opp.companyName}</p>
                  </div>
                  {opp.amount && (
                    <div className="text-right">
                      <p className="text-xs text-stone-400">预算</p>
                      <p className="text-sm font-bold text-blue-600">{opp.amount} {opp.currency}</p>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full" />
      </div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
          立即加入，把握中日贸易先机
        </h2>
        <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
          免费开始浏览，每日获取精选商机推送。升级专业版，解锁完整数据API和精准匹配服务。
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-blue-600 bg-white hover:bg-blue-50 rounded-xl transition-all shadow-xl"
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

export default function HomePage() {
  return (
    <SiteLayout>
      <HeroSection />
<FeaturedNews />
      <TradeDataPreview />
      <OpportunitiesPreview />
      <CTASection />
    </SiteLayout>
  );
}
