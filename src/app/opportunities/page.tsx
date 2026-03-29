'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SiteLayout from '@/components/layout/SiteLayout';
import { formatRelativeTime, getOpportunityTypeLabel, getCountryLabel, cn } from '@/lib/utils';
import type { BusinessOpportunity } from '@/types';

const typeFilters = [
  { value: 'all', label: '全部类型' },
  { value: 'supply', label: '供应信息' },
  { value: 'demand', label: '采购需求' },
  { value: 'investment', label: '投资项目' },
  { value: 'cooperation', label: '合作洽谈' },
];

const countryFilters = [
  { value: 'all', label: '全部地区' },
  { value: 'cn', label: '来自中国' },
  { value: 'jp', label: '来自日本' },
  { value: 'bilateral', label: '中日合作' },
];

function OpportunityCard({ opp }: { opp: BusinessOpportunity }) {
  return (
    <article className="group">
      <Link href={`/opportunities/${opp.id}`} className="block h-full">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-lg hover:border-blue-200 transition-all h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-3 gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(
                'px-2.5 py-1 text-[11px] font-bold rounded-full border',
                opp.type === 'supply' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                opp.type === 'demand' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                opp.type === 'investment' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                'bg-emerald-50 text-emerald-600 border-emerald-100'
              )}>
                {getOpportunityTypeLabel(opp.type)}
              </span>
              {opp.isPremium && (
                <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0">
                  优选商家
                </span>
              )}
            </div>
            <span className={cn(
              'px-2.5 py-1 text-[11px] font-medium rounded-full border flex-shrink-0',
              opp.country === 'cn' ? 'bg-red-50 text-red-600 border-red-100' :
              opp.country === 'jp' ? 'bg-blue-50 text-blue-600 border-blue-100' :
              'bg-purple-50 text-purple-600 border-purple-100'
            )}>
              {getCountryLabel(opp.country)}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-stone-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors">
            {opp.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-stone-500 leading-relaxed line-clamp-3 flex-1">
            {opp.description}
          </p>

          {/* Meta */}
          <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-xs text-stone-400">{opp.industry}</p>
                <p className="font-semibold text-stone-700">{opp.companyName}</p>
                {opp.region && <p className="text-xs text-stone-400 mt-0.5">📍 {opp.region}</p>}
              </div>
              {opp.amount && (
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-stone-400">预算</p>
                  <p className="text-sm font-black text-blue-600">{opp.amount}</p>
                  <p className="text-[10px] text-stone-400">{opp.currency}</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'px-2 py-0.5 text-[11px] font-medium rounded-full border',
                  opp.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  'bg-amber-50 text-amber-600 border-amber-100'
                )}>
                  {opp.status === 'active' ? '● 招募中' : '待审核'}
                </span>
              </div>
              <span className="text-xs text-stone-400">
                {formatRelativeTime(opp.publishedAt)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function OpportunitiesPage() {
  const [activeType, setActiveType] = useState('all');
  const [activeCountry, setActiveCountry] = useState('all');
  const [activeIndustry, setActiveIndustry] = useState('全部行业');
  const [showPremium, setShowPremium] = useState(false);
  const [allOpps, setAllOpps] = useState<BusinessOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/opportunities.json')
      .then((r) => r.json())
      .then((data) => {
        setAllOpps(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const industries = ['全部行业', ...Array.from(new Set(allOpps.map((o) => o.industry)))];

  const filtered = allOpps.filter((o) => {
    const typeMatch = activeType === 'all' || o.type === activeType;
    const countryMatch = activeCountry === 'all' || o.country === activeCountry;
    const industryMatch = activeIndustry === '全部行业' || o.industry === activeIndustry;
    const premiumMatch = !showPremium || o.isPremium;
    return typeMatch && countryMatch && industryMatch && premiumMatch;
  });

  return (
    <SiteLayout>
      {/* Page Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-black text-stone-900 mb-2">商机广场</h1>
          <p className="text-stone-500">中日双边贸易合作机会，实时更新，精准匹配</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex flex-wrap gap-6">
            {/* Type */}
            <div>
              <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">类型</p>
              <div className="flex flex-wrap gap-2">
                {typeFilters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setActiveType(f.value)}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-lg border transition-all',
                      activeType === f.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-blue-200'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Country */}
            <div>
              <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">地区</p>
              <div className="flex flex-wrap gap-2">
                {countryFilters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setActiveCountry(f.value)}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-lg border transition-all',
                      activeCountry === f.value
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Industry */}
            <div>
              <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">行业</p>
              <div className="flex flex-wrap gap-2">
                {industries.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => setActiveIndustry(ind)}
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-lg border transition-all',
                      activeIndustry === ind
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                    )}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            {/* Premium toggle */}
            <div className="flex items-center ml-auto">
              <button
                onClick={() => setShowPremium(!showPremium)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all',
                  showPremium
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0'
                    : 'bg-white text-stone-500 border-stone-200'
                )}
              >
                <span>🌟</span>
                仅显示优选
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-500">
            共 <span className="font-bold text-stone-800">{filtered.length}</span> 条商机
          </p>
          <Link
            href="/pricing"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            升级解锁完整商机 →
          </Link>
        </div>

        {/* Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 animate-pulse">
                <div className="h-6 bg-stone-100 rounded w-1/3 mb-3" />
                <div className="h-4 bg-stone-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-stone-100 rounded w-1/2 mb-4" />
                <div className="h-20 bg-stone-100 rounded mb-4" />
                <div className="h-4 bg-stone-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
            <div className="text-5xl mb-4 text-stone-200">🔍</div>
            <p className="text-stone-500 mb-4">暂无符合条件的商机</p>
            <Link href="/pricing" className="text-sm font-medium text-blue-600 hover:underline">
              升级专业版获取更多商机
            </Link>
          </div>
        )}
{/* Post CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-1">发布您的商机信息</h3>
            <p className="text-blue-100 text-sm">让中日双边企业主动找到您，快速拓展商业版图</p>
          </div>
          <Link
            href="/pricing"
            className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-blue-600 bg-white hover:bg-blue-50 rounded-xl transition-colors"
          >
            立即发布
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
