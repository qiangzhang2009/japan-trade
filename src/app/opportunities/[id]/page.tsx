import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteLayout from '@/components/layout/SiteLayout';
import { getOpportunityById, getOpportunities } from '@/lib/dataService';
import { formatDate, formatRelativeTime, getOpportunityTypeLabel, getCountryLabel, getCountryFlag, getCooperationTypeLabel, cn } from '@/lib/utils';

export default async function OpportunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [opp, allOpps] = await Promise.all([
    getOpportunityById(params.id),
    getOpportunities(),
  ]);

  if (!opp) {
    notFound();
  }

  const related = allOpps
    .filter((o) => o.id !== opp.id && (o.type === opp.type || o.industry === opp.industry))
    .slice(0, 3);

  const expiresDate = opp.expiresAt ? new Date(opp.expiresAt) : null;
  const now = new Date();
  const daysLeft = expiresDate ? Math.max(0, Math.ceil((expiresDate.getTime() - now.getTime()) / 86400000)) : null;

  const typeColors: Record<string, string> = {
    supply: 'bg-blue-50 text-blue-600 border-blue-100',
    demand: 'bg-amber-50 text-amber-600 border-amber-100',
    investment: 'bg-purple-50 text-purple-600 border-purple-100',
    cooperation: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  const countryBgColors: Record<string, string> = {
    japan: 'bg-red-50 text-red-600 border-red-100',
    'south-korea': 'bg-blue-50 text-blue-600 border-blue-100',
    singapore: 'bg-red-50 text-red-600 border-red-100',
    vietnam: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    indonesia: 'bg-orange-50 text-orange-600 border-orange-100',
    malaysia: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    thailand: 'bg-blue-50 text-blue-700 border-blue-100',
    philippines: 'bg-blue-50 text-blue-600 border-blue-100',
    india: 'bg-orange-50 text-orange-700 border-orange-100',
    pakistan: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    cambodia: 'bg-blue-50 text-blue-600 border-blue-100',
    laos: 'bg-red-50 text-red-600 border-red-100',
    myanmar: 'bg-yellow-50 text-yellow-600 border-yellow-100',
  };

  return (
    <SiteLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-stone-400 mb-8">
          <Link href="/" className="hover:text-blue-600 transition-colors">首页</Link>
          <span>/</span>
          <Link href="/opportunities" className="hover:text-blue-600 transition-colors">商机广场</Link>
          {opp.country && (
            <>
              <span>/</span>
              <Link href={`/countries/${opp.country}`} className="hover:text-blue-600 transition-colors">
                {getCountryLabel(opp.country)}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-stone-600 truncate max-w-xs">{opp.title.slice(0, 20)}...</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={cn(
                  'px-2.5 py-1 text-xs font-bold rounded-full border',
                  typeColors[opp.type] ?? 'bg-stone-50 text-stone-600 border-stone-100'
                )}>
                  {getOpportunityTypeLabel(opp.type)}
                </span>
                <span className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-full border',
                  countryBgColors[opp.country] ?? 'bg-stone-50 text-stone-600 border-stone-100'
                )}>
                  {getCountryFlag(opp.country)} {getCountryLabel(opp.country)}
                </span>
                {opp.isPremium && (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                    ⭐ 优选商家
                  </span>
                )}
                {opp.cooperationType && (
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                    {getCooperationTypeLabel(opp.cooperationType)}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight mb-4">
                {opp.title}
              </h1>

              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-stone-100">
                <div>
                  <p className="text-xs text-stone-400">行业</p>
                  <p className="text-sm font-semibold text-stone-800">{opp.industry}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400">发布时间</p>
                  <p className="text-sm font-semibold text-stone-800">{formatDate(opp.publishedAt)}</p>
                </div>
                {opp.regionLabel && (
                  <div>
                    <p className="text-xs text-stone-400">经济圈</p>
                    <p className="text-sm font-semibold text-stone-800">📍 {opp.regionLabel}</p>
                  </div>
                )}
                {opp.region && !opp.regionLabel && (
                  <div>
                    <p className="text-xs text-stone-400">地区</p>
                    <p className="text-sm font-semibold text-stone-800">📍 {opp.region}</p>
                  </div>
                )}
                {daysLeft !== null && (
                  <div>
                    <p className="text-xs text-stone-400">剩余有效期</p>
                    <p className={cn('text-sm font-semibold', daysLeft < 7 ? 'text-red-600' : 'text-stone-800')}>
                      {daysLeft} 天
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h2 className="text-lg font-bold text-stone-900 mb-4">详情描述</h2>
              <p className="text-base text-stone-700 leading-relaxed whitespace-pre-wrap">{opp.description}</p>
              {opp.descriptionEn && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <h3 className="text-sm font-semibold text-stone-500 mb-2">English</h3>
                  <p className="text-base text-stone-600 leading-relaxed">{opp.descriptionEn}</p>
                </div>
              )}
            </div>

            {/* Company Info */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h2 className="text-lg font-bold text-stone-900 mb-4">企业信息</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🏢</span>
                  </div>
                  <div>
                    <p className="font-bold text-stone-900">{opp.companyName}</p>
                    {opp.companyNameEn && (
                      <p className="text-sm text-stone-500">{opp.companyNameEn}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Why this matters */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-6">
              <h2 className="text-base font-bold text-blue-900 mb-3">为什么关注此商机</h2>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-blue-800">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  {opp.type === 'supply' ? '供应商直连，减少中间环节，提升利润空间' : ''}
                  {opp.type === 'demand' ? '采购需求明确，供应商可直接对接，减少销售周期' : ''}
                  {opp.type === 'investment' ? '跨境投资机会，享受双边政策优惠' : ''}
                  {opp.type === 'cooperation' ? '联合合作分摊成本，共享市场资源与渠道优势' : ''}
                </li>
                <li className="flex items-start gap-2 text-sm text-blue-800">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  {opp.country === 'japan' ? '日本市场消费力强，品牌溢价高' :
                   opp.country === 'south-korea' ? '韩国市场电子产业发达，合作机遇多' :
                   opp.country === 'vietnam' ? '越南制造业崛起，劳动力成本优势明显' :
                   opp.country === 'singapore' ? '新加坡金融中心，东南亚市场跳板' :
                   '目标市场增长迅速，发展潜力巨大'}
                </li>
                {opp.regionLabel && (
                  <li className="flex items-start gap-2 text-sm text-blue-800">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    {opp.regionLabel.includes('首都') || opp.regionLabel.includes('Tokyo') ? '位于核心经济圈，配套设施完善' :
                     opp.regionLabel.includes('经济') ? '产业集群优势明显，供应链完善' :
                     '交通便利，市场覆盖能力强'}
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Key Stats Card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 sticky top-24">
              {opp.amount && (
                <div className="mb-5 pb-5 border-b border-stone-100">
                  <p className="text-xs text-stone-400 mb-1">预算规模</p>
                  <p className="text-2xl font-black text-blue-600">{opp.amount}万</p>
                  <p className="text-xs text-stone-400">
                    {opp.currency === 'CNY' ? '人民币' : opp.currency === 'JPY' ? '日元' : '美元'}
                  </p>
                </div>
              )}

              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate text-xs">{opp.contactEmail}</span>
                </div>
                {daysLeft !== null && (
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={daysLeft < 30 ? 'text-amber-600 font-medium' : 'text-stone-600'}>
                      剩余 {daysLeft} 天
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-emerald-600 font-medium">已认证企业</span>
                </div>
                {opp.dataSource && (
                  <div className="flex items-center gap-2 text-xs text-stone-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>数据来源：{opp.dataSource}</span>
                  </div>
                )}
              </div>

              <button className="w-full py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg hover:shadow-xl">
                申请对接合作
              </button>

              <div className="mt-4 pt-4 border-t border-stone-100 space-y-2">
                <Link
                  href="/pricing"
                  className="block w-full py-2.5 text-center text-sm font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                >
                  升级获取精准匹配
                </Link>
                <Link
                  href="/opportunities"
                  className="block w-full py-2 text-center text-xs text-stone-400 hover:text-stone-600 transition-colors"
                >
                  查看更多商机 →
                </Link>
              </div>
            </div>

            {/* Related Opportunities */}
            {related.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200 p-5">
                <h3 className="text-sm font-bold text-stone-900 mb-4">相关商机</h3>
                <div className="space-y-4">
                  {related.map((item) => (
                    <Link key={item.id} href={`/opportunities/${item.id}`} className="block group">
                      <div className="flex items-start gap-2">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 group-hover:bg-blue-600 transition-colors" />
                        <div>
                          <p className="text-sm font-medium text-stone-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {item.title}
                          </p>
                          <p className="text-xs text-stone-400 mt-0.5">
                            {getOpportunityTypeLabel(item.type)} · {formatRelativeTime(item.publishedAt)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
