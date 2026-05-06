import type { Country } from '@/types';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import SiteLayout from '@/components/layout/SiteLayout';
import { getCountryById, getOpportunitiesByCountry } from '@/lib/dataService';
import { formatRelativeTime, getOpportunityTypeLabel, getCooperationTypeLabel } from '@/lib/utils';

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const country = await getCountryById((await params).country);
  if (!country) return { title: '未找到市场' };
  return {
    title: `${country.nameZh} ${country.nameEn} — 出海通 AsiaBridge`,
    description: `了解${country.nameZh}市场商机：${country.summary}。覆盖${country.mainIndustries.join('、')}等行业，${country.regions.length}个经济圈。`,
  };
}

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ country: string }>;
}

export async function generateStaticParams() {
  return [];
}

async function CountryHeroInner(props: { country: Country }) {
  const { country } = props;
  return (
    <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-4">
          <span className="text-6xl">{country.flag}</span>
          <div>
            <h1 className="text-4xl font-black text-white mb-1">{country.nameZh}</h1>
            <p className="text-blue-300 text-lg mb-4">{country.nameEn}</p>
            <p className="text-blue-200 max-w-2xl">{country.summary}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'GDP', value: country.gdp || '—' },
            { label: '人口', value: country.population || '—' },
            { label: '主要产业', value: country.mainIndustries.slice(0, 2).join(' / ') },
            { label: '梯队', value: country.tier === 1 ? '高价值市场' : country.tier === 2 ? '增长市场' : '新兴前沿' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
              <p className="text-xs text-blue-300 mb-1">{stat.label}</p>
              <p className="text-sm font-bold text-white leading-snug">{stat.value}</p>
            </div>
          ))}
        </div>

        {country.regions.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {country.regions.map(reg => (
              <div key={reg.id} className="bg-white/10 border border-white/10 rounded-lg px-3 py-2">
                <p className="text-xs font-semibold text-white">{reg.nameZh}</p>
                {reg.description && (
                  <p className="text-[10px] text-blue-300 mt-0.5">{reg.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function CountryPageInner(props: Props) {
  const countryId = (await props.params).country;
  const [country, opportunities] = await Promise.all([
    getCountryById(countryId),
    getOpportunitiesByCountry(countryId),
  ]);

  if (!country) {
    notFound();
  }

  const activeOpps = opportunities.filter(o => o.status === 'active');
  const premiumOpps = activeOpps.filter(o => o.isPremium);
  const byRegion = activeOpps.reduce((acc, o) => {
    const r = o.regionLabel || '其他';
    if (!acc[r]) acc[r] = [];
    acc[r].push(o);
    return acc;
  }, {} as Record<string, typeof activeOpps>);

  return (
    <SiteLayout>
      <CountryHeroInner country={country} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: '活跃商机', value: activeOpps.length, color: 'text-blue-700' },
            { label: '优选商机', value: premiumOpps.length, color: 'text-amber-600' },
            { label: '经济圈覆盖', value: country.regions.length, color: 'text-emerald-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-stone-200 p-4 text-center">
              <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-stone-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {country.regions.length > 0 && Object.keys(byRegion).length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              按经济圈分布
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {country.regions.map(reg => {
                const opps = byRegion[reg.nameZh] || [];
                if (opps.length === 0) return null;
                return (
                  <div key={reg.id} className="bg-stone-50 rounded-xl border border-stone-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-stone-800">{reg.nameZh}</h3>
                      <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{opps.length}</span>
                    </div>
                    {reg.description && (
                      <p className="text-xs text-stone-400 mb-2">{reg.description}</p>
                    )}
                    <div className="space-y-1.5">
                      {opps.slice(0, 2).map(opp => (
                        <Link key={opp.id} href={`/opportunities/${opp.id}`} className="block">
                          <p className="text-xs text-stone-600 hover:text-blue-600 transition-colors line-clamp-1 leading-snug">
                            {opp.title}
                          </p>
                        </Link>
                      ))}
                      {opps.length > 2 && (
                        <Link href={`/opportunities?country=${countryId}&region=${reg.id}`} className="text-[10px] text-blue-600 hover:underline">
                          查看全部{opps.length}个商机 →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <h2 className="text-lg font-bold text-stone-800 mb-4">
          全部商机
          <span className="text-sm font-normal text-stone-400 ml-2">({activeOpps.length}个活跃中)</span>
        </h2>

        {activeOpps.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-stone-700 mb-2">暂无{country.nameZh}商机</h3>
            <p className="text-stone-500 mb-4">数据采集中，即将上线</p>
            <Link href="/opportunities" className="text-sm text-blue-600 hover:underline">
              浏览其他市场商机 →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOpps.map(opp => (
              <Link key={opp.id} href={`/opportunities/${opp.id}`} className="group">
                <div className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-md hover:border-blue-200 transition-all flex items-center gap-4">
                  <div className="flex flex-col gap-2 w-32 flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                      opp.type === 'supply' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      opp.type === 'demand' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      opp.type === 'investment' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                      'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {getOpportunityTypeLabel(opp.type)}
                    </span>
                    {opp.cooperationType && (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-stone-100 text-stone-500 border border-stone-200">
                        {getCooperationTypeLabel(opp.cooperationType)}
                      </span>
                    )}
                    {opp.isPremium && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                        ⭐优选
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-stone-800 group-hover:text-blue-600 transition-colors mb-1 leading-snug">
                      {opp.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400">
                      <span>{opp.industry}</span>
                      {opp.regionLabel && <span>📍 {opp.regionLabel}</span>}
                      <span>{opp.companyName}</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    {opp.amount && (
                      <div className="text-sm font-black text-blue-700">{opp.amount}万 {opp.currency}</div>
                    )}
                    <div className="text-[10px] text-stone-400 mt-1">{formatRelativeTime(opp.publishedAt)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 bg-gradient-to-r from-blue-900 to-blue-950 rounded-2xl p-8 text-white text-center">
          <h3 className="text-xl font-bold mb-2">想成为{country.nameZh}市场的首批合作方？</h3>
          <p className="text-blue-300 text-sm mb-4">
            发布您的商机信息，让{country.nameZh}企业主动找上门
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-blue-900 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg transition-colors"
          >
            发布商机
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
