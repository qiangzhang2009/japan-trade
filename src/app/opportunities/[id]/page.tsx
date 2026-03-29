import Link from 'next/link';
import SiteLayout from '@/components/layout/SiteLayout';
import { getOpportunityById, getOpportunities } from '@/lib/dataService';
import { formatDate, formatRelativeTime, getOpportunityTypeLabel, getCountryLabel, cn } from '@/lib/utils';

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
    return (
      <SiteLayout>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">商机未找到</h1>
          <p className="text-stone-500 mb-8">您访问的商机不存在或已下架</p>
          <Link href="/opportunities" className="text-blue-600 hover:underline">
            返回商机广场
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const related = allOpps
    .filter((o) => o.id !== opp.id && (o.type === opp.type || o.industry === opp.industry))
    .slice(0, 3);

  const expiresDate = opp.expiresAt ? new Date(opp.expiresAt) : null;
  const now = new Date();
  const daysLeft = expiresDate ? Math.max(0, Math.ceil((expiresDate.getTime() - now.getTime()) / 86400000)) : null;

  return (
    <SiteLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-stone-400 mb-8">
          <Link href="/" className="hover:text-blue-600 transition-colors">首页</Link>
          <span>/</span>
          <Link href="/opportunities" className="hover:text-blue-600 transition-colors">商机广场</Link>
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
                  opp.type === 'supply' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                  opp.type === 'demand' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  opp.type === 'investment' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                  'bg-emerald-50 text-emerald-600 border-emerald-100'
                )}>
                  {getOpportunityTypeLabel(opp.type)}
                </span>
                <span className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-full border',
                  opp.country === 'cn' ? 'bg-red-50 text-red-600 border-red-100' :
                  opp.country === 'jp' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                  'bg-purple-50 text-purple-600 border-purple-100'
                )}>
                  {getCountryLabel(opp.country)}
                </span>
                {opp.isPremium && (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                    优选商家
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
                {opp.region && (
                  <div>
                    <p className="text-xs text-stone-400">地区</p>
                    <p className="text-sm font-semibold text-stone-800">📍 {opp.region}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h2 className="text-lg font-bold text-stone-900 mb-4">详情描述</h2>
              <p className="text-base text-stone-700 leading-relaxed">{opp.description}</p>
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
                    {opp.companyNameJp && (
                      <p className="text-sm text-stone-500">{opp.companyNameJp}</p>
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
                  {opp.type === 'investment' ? '跨境投资机会，享受中日双边政策优惠' : ''}
                  {opp.type === 'cooperation' ? '联合研发分摊成本，共享知识产权与市场资源' : ''}
                </li>
                <li className="flex items-start gap-2 text-sm text-blue-800">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  中日贸易政策支持，行业前景广阔
                </li>
                <li className="flex items-start gap-2 text-sm text-blue-800">
                  <span className="text-blue-500 mt-0.5">✓</span>
                  {opp.region?.includes('都') || opp.region?.includes('県') || opp.region?.includes('府')
                    ? '位于日本核心工业区，配套设施完善'
                    : '位于中国重点经济区，产业集群优势明显'}
                </li>
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
                  <p className="text-2xl font-black text-blue-600">{opp.amount}</p>
                  <p className="text-xs text-stone-400">{opp.currency === 'CNY' ? '人民币' : opp.currency === 'JPY' ? '日元' : '美元'}</p>
                </div>
              )}

              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate">{opp.contactEmail}</span>
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
                  <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-emerald-600 font-medium">已认证企业</span>
                </div>
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
