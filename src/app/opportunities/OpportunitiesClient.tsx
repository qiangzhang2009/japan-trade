'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import SiteLayout from '@/components/layout/SiteLayout';
import {
  formatRelativeTime,
  getCountryLabel,
  getCountryFlag,
  getOpportunityTypeLabel,
  getCooperationTypeLabel,
  getTierLabel,
  cn,
} from '@/lib/utils';
import type { BusinessOpportunity, Country } from '@/types';

// ============================================================
// Filter options
// ============================================================
const TYPE_FILTERS = [
  { value: 'all', label: '全部类型', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
  )},
  { value: 'supply', label: '供应信息', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
  )},
  { value: 'demand', label: '采购需求', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
  )},
  { value: 'investment', label: '投资项目', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
  )},
  { value: 'cooperation', label: '合作洽谈', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  )},
];

const SORT_OPTIONS = [
  { value: 'latest', label: '最新发布' },
  { value: 'premium', label: '优选优先' },
  { value: 'amount', label: '预算最高' },
];

// ============================================================
// Helpers
// ============================================================
function getDaysRemaining(expiresAt: string): number {
  const now = new Date();
  const expires = new Date(expiresAt);
  return Math.max(0, Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function typeColor(type: string) {
  const map: Record<string, string> = {
    supply: 'bg-blue-50 text-blue-600 border-blue-100',
    demand: 'bg-amber-50 text-amber-600 border-amber-100',
    investment: 'bg-purple-50 text-purple-600 border-purple-100',
    cooperation: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };
  return map[type] ?? 'bg-stone-50 text-stone-600 border-stone-100';
}

function typeIconBg(type: string) {
  const map: Record<string, string> = {
    supply: 'bg-blue-100 text-blue-600',
    demand: 'bg-amber-100 text-amber-600',
    investment: 'bg-purple-100 text-purple-600',
    cooperation: 'bg-emerald-100 text-emerald-600',
  };
  return map[type] ?? 'bg-stone-100 text-stone-600';
}

function typeLabelBg(type: string) {
  const map: Record<string, string> = {
    supply: 'bg-blue-50 text-blue-700',
    demand: 'bg-amber-50 text-amber-700',
    investment: 'bg-purple-50 text-purple-700',
    cooperation: 'bg-emerald-50 text-emerald-700',
  };
  return map[type] ?? 'bg-stone-50 text-stone-700';
}

// ============================================================
// Country Sidebar
// ============================================================
function CountrySidebar({
  countries,
  activeCountry,
  onCountryChange,
  oppCountByCountry,
}: {
  countries: Country[];
  activeCountry: string;
  onCountryChange: (c: string) => void;
  oppCountByCountry: Record<string, number>;
}) {
  const tier1 = countries.filter(c => c.tier === 1);
  const tier2 = countries.filter(c => c.tier === 2);
  const tier3 = countries.filter(c => c.tier === 3);

  function TierSection({ tier, label, countries }: { tier: 1 | 2 | 3; label: string; countries: Country[] }) {
    return (
      <div className="mb-4">
        <p className={cn(
          'text-[10px] font-bold uppercase tracking-wider mb-1.5',
          tier === 1 ? 'text-amber-600' : tier === 2 ? 'text-stone-500' : 'text-orange-500'
        )}>{label}</p>
        {countries.map(c => {
          const count = oppCountByCountry[c.id] || 0;
          const isActive = activeCountry === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onCountryChange(isActive ? 'all' : c.id)}
              className={cn(
                'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-sm transition-all mb-0.5',
                isActive
                  ? 'bg-blue-800 text-white font-semibold'
                  : 'text-stone-600 hover:bg-stone-100'
              )}
            >
              <span className="text-base leading-none">{c.flag}</span>
              <span className="flex-1 truncate">{c.nameZh}</span>
              <span className={cn(
                'text-[10px] font-mono px-1.5 py-0.5 rounded-full',
                isActive ? 'bg-blue-700 text-blue-200' : 'bg-stone-100 text-stone-400'
              )}>{count}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <aside className="w-52 flex-shrink-0 hidden lg:block">
      <div className="sticky top-20 bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          目标市场
        </h3>

        <button
          onClick={() => onCountryChange('all')}
          className={cn(
            'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm mb-3 font-medium transition-all',
            activeCountry === 'all'
              ? 'bg-stone-900 text-white'
              : 'text-stone-500 hover:bg-stone-100'
          )}
        >
          <span className="text-base">🌏</span>
          <span>全部市场</span>
        </button>

        <TierSection tier={1} label="高价值市场" countries={tier1} />
        <TierSection tier={2} label="增长市场" countries={tier2} />
        <TierSection tier={3} label="新兴前沿" countries={tier3} />
      </div>
    </aside>
  );
}

// ============================================================
// Region Filter Pills
// ============================================================
function RegionFilter({
  country,
  countries,
  activeRegion,
  onRegionChange,
}: {
  country: string;
  countries: Country[];
  activeRegion: string;
  onRegionChange: (r: string) => void;
}) {
  const countryData = countries.find(c => c.id === country);
  if (!countryData || countryData.regions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onRegionChange('all')}
        className={cn(
          'px-3 py-1 text-xs font-medium rounded-full border transition-all',
          activeRegion === 'all'
            ? 'bg-blue-800 text-white border-blue-800'
            : 'bg-white text-stone-500 border-stone-200 hover:border-blue-300'
        )}
      >
        全部区域
      </button>
      {countryData.regions.map(reg => (
        <button
          key={reg.id}
          onClick={() => onRegionChange(activeRegion === reg.id ? 'all' : reg.id)}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-full border transition-all',
            activeRegion === reg.id
              ? 'bg-blue-700 text-white border-blue-700'
              : 'bg-white text-stone-500 border-stone-200 hover:border-blue-300'
          )}
        >
          {reg.nameZh}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// Opportunity Card
// ============================================================
function OpportunityCard({ opp }: { opp: BusinessOpportunity }) {
  const daysRemaining = getDaysRemaining(opp.expiresAt);
  const isUrgent = daysRemaining <= 7 && daysRemaining > 0;
  const isExpiringSoon = daysRemaining <= 3 && daysRemaining > 0;

  return (
    <article className={cn('group relative transition-all duration-300', opp.isPremium && 'premium-card-wrap')}>
      <Link href={`/opportunities/${opp.id}`} className="block h-full">
        <div className={cn(
          'bg-white rounded-2xl border p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative overflow-hidden',
          opp.isPremium
            ? 'border-amber-300 shadow-amber-100'
            : 'border-stone-200 hover:border-blue-200'
        )}>
          {/* Premium gradient overlay */}
          {opp.isPremium && (
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 via-transparent to-orange-50/30 pointer-events-none" />
          )}

          {/* Header */}
          <div className="flex items-start justify-between mb-3 gap-2 relative z-10">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Type badge */}
              <span className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full border',
                typeColor(opp.type)
              )}>
                <span className={cn('w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold', typeIconBg(opp.type))}>
                  {opp.type === 'supply' ? '供' : opp.type === 'demand' ? '采' : opp.type === 'investment' ? '投' : '合'}
                </span>
                {getOpportunityTypeLabel(opp.type)}
              </span>

              {/* Premium badge */}
              {opp.isPremium && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-sm">
                  <span className="w-3 h-3">⭐</span>
                  优选
                </span>
              )}

              {/* Cooperation type */}
              {opp.cooperationType && (
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-stone-100 text-stone-500 border border-stone-200">
                  {getCooperationTypeLabel(opp.cooperationType)}
                </span>
              )}
            </div>

            {/* Country + Region */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-lg leading-none">{getCountryFlag(opp.country)}</span>
              <span className={cn(
                'px-1.5 py-0.5 text-[10px] font-medium rounded-full',
                opp.country === 'japan' ? 'bg-red-50 text-red-600' :
                opp.country === 'south-korea' ? 'bg-blue-50 text-blue-600' :
                opp.country === 'singapore' ? 'bg-red-50 text-red-600' :
                'bg-emerald-50 text-emerald-600'
              )}>
                {getCountryLabel(opp.country)}
              </span>
            </div>
          </div>

          {/* Industry tag */}
          <div className="mb-2.5 relative z-10">
            <span className="inline-block px-2.5 py-1 text-[10px] font-medium rounded-full bg-stone-100 text-stone-600 border border-stone-200">
              {opp.industry}
            </span>
            {opp.regionLabel && (
              <span className="inline-block ml-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-stone-50 text-stone-400 border border-stone-200">
                📍 {opp.regionLabel}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className={cn(
            'font-bold leading-snug mb-2 relative z-10 group-hover:text-blue-700 transition-colors line-clamp-2',
            opp.isPremium ? 'text-stone-900 text-base' : 'text-stone-800 text-sm'
          )}>
            {opp.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-stone-500 leading-relaxed line-clamp-2 flex-1 relative z-10">
            {opp.description}
          </p>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-stone-100 relative z-10">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-stone-400 mb-0.5 truncate">{opp.companyName}</p>
              </div>

              {opp.amount && opp.currency && (
                <div className="text-right flex-shrink-0 bg-stone-50 rounded-lg px-2.5 py-1.5">
                  <p className="text-[10px] text-stone-400">预算</p>
                  <p className="text-sm font-black text-blue-700">{opp.amount}万</p>
                  <p className="text-[10px] text-stone-400">{opp.currency}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status row */}
          <div className="mt-3 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border',
                opp.status === 'active'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  : opp.status === 'pending'
                  ? 'bg-amber-50 text-amber-600 border-amber-100'
                  : 'bg-stone-100 text-stone-500 border-stone-200'
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {opp.status === 'active' ? '招募中' : opp.status === 'pending' ? '待审核' : '已结束'}
              </span>

              {isUrgent && (
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full',
                  isExpiringSoon
                    ? 'bg-red-100 text-red-600'
                    : 'bg-amber-100 text-amber-600'
                )}>
                  ⏰ {daysRemaining}天
                </span>
              )}
            </div>

            <span className="text-[11px] text-stone-400">
              {formatRelativeTime(opp.publishedAt)}
            </span>
          </div>
        </div>
      </Link>

      {/* Hover CTA */}
      <Link
        href={`/opportunities/${opp.id}`}
        className={cn(
          'absolute bottom-5 right-5 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0',
          opp.isPremium
            ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600'
            : 'bg-blue-600 hover:bg-blue-700'
        )}
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-lg shadow-lg">
          查看详情
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
      </Link>
    </article>
  );
}

// ============================================================
// Stats Bar
// ============================================================
function StatsBar({ opps, countries }: { opps: BusinessOpportunity[]; countries: Country[] }) {
  const byType = opps.reduce((acc, o) => {
    acc[o.type] = (acc[o.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byCountry = opps.reduce((acc, o) => {
    acc[o.country] = (acc[o.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCountries = Object.entries(byCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="bg-gradient-to-r from-stone-800 via-stone-900 to-stone-800 py-3.5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-5 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-stone-400">全部商机</span>
            <span className="font-black text-white text-lg">{opps.length}</span>
          </div>

          <div className="w-px h-5 bg-stone-700 hidden sm:block" />

          {topCountries.map(([country, count]) => {
            const countryData = countries.find(c => c.id === country);
            if (!countryData) return null;
            return (
              <div key={country} className="flex items-center gap-1.5">
                <span>{countryData.flag}</span>
                <span className="text-stone-300">{countryData.nameZh}</span>
                <span className="font-bold text-white">{count}</span>
              </div>
            );
          })}

          <div className="w-px h-5 bg-stone-700 hidden sm:block" />

          {Object.entries(byType).map(([type, count]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className="text-stone-300">{getOpportunityTypeLabel(type)}</span>
              <span className="font-bold text-white">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-lg font-bold text-stone-700 mb-2">
        {hasFilters ? '未找到匹配的商机' : '暂无商机信息'}
      </h3>
      <p className="text-stone-500 mb-6 max-w-md mx-auto text-sm">
        {hasFilters
          ? '尝试调整筛选条件，获取更多商机推荐'
          : '成为第一个发布商机信息的企业，抢占商业先机'}
      </p>
      {hasFilters ? (
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          重置筛选
        </button>
      ) : (
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
        >
          立即发布商机
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </Link>
      )}
    </div>
  );
}

// ============================================================
// Scroll to Top
// ============================================================
function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const toggle = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', toggle);
    return () => window.removeEventListener('scroll', toggle);
  }, []);
  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-50 p-3 bg-blue-800 hover:bg-blue-900 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
      aria-label="滚动到顶部"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  );
}

// ============================================================
// Main Client Component
// ============================================================
interface OpportunitiesClientProps {
  initialOpps: BusinessOpportunity[];
  countries: Country[];
}

export default function OpportunitiesClient({ initialOpps, countries }: OpportunitiesClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCountry, setActiveCountry] = useState('all');
  const [activeRegion, setActiveRegion] = useState('all');
  const [activeType, setActiveType] = useState('all');
  const [activeIndustry, setActiveIndustry] = useState('全部行业');
  const [activeSort, setActiveSort] = useState('latest');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [allOpps] = useState<BusinessOpportunity[]>(initialOpps);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Read URL params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('country')) setActiveCountry(params.get('country')!);
      if (params.get('type')) setActiveType(params.get('type')!);
      if (params.get('search')) setSearchQuery(params.get('search')!);
    }
  }, []);

  // Write URL params on filter change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      if (activeCountry !== 'all') params.set('country', activeCountry);
      if (activeType !== 'all') params.set('type', activeType);
      if (searchQuery) params.set('search', searchQuery);
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [activeCountry, activeType, searchQuery]);

  // Derive industry options
  const industries = useMemo(() => {
    const unique = Array.from(new Set(allOpps.map(o => o.industry)));
    return ['全部行业', ...unique.sort()];
  }, [allOpps]);

  // Filtered + sorted results
  const filtered = useMemo(() => {
    let result = allOpps.filter(o => {
      if (o.status === 'closed') return false;

      const searchLower = searchQuery.toLowerCase();
      const searchMatch =
        !searchQuery ||
        o.title.toLowerCase().includes(searchLower) ||
        o.description.toLowerCase().includes(searchLower) ||
        o.companyName.toLowerCase().includes(searchLower) ||
        o.industry.toLowerCase().includes(searchLower) ||
        (o.titleEn || '').toLowerCase().includes(searchLower);

      const countryMatch = activeCountry === 'all' || o.country === activeCountry;
      const regionMatch = activeRegion === 'all' || o.region === activeRegion;
      const typeMatch = activeType === 'all' || o.type === activeType;
      const industryMatch = activeIndustry === '全部行业' || o.industry === activeIndustry;
      const premiumMatch = !showPremiumOnly || o.isPremium;

      return searchMatch && countryMatch && regionMatch && typeMatch && industryMatch && premiumMatch;
    });

    result.sort((a, b) => {
      if (activeSort === 'premium') {
        if (a.isPremium !== b.isPremium) return a.isPremium ? -1 : 1;
      }
      if (activeSort === 'amount') {
        const aNum = parseFloat(a.amount || '0');
        const bNum = parseFloat(b.amount || '0');
        if (aNum !== bNum) return bNum - aNum;
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    return result;
  }, [allOpps, searchQuery, activeCountry, activeRegion, activeType, activeIndustry, showPremiumOnly, activeSort]);

  // Stats: opp count by country
  const oppCountByCountry = useMemo(() => {
    return allOpps
      .filter(o => o.status === 'active')
      .reduce((acc, o) => {
        acc[o.country] = (acc[o.country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
  }, [allOpps]);

  const hasActiveFilters = !!(
    searchQuery || activeCountry !== 'all' || activeRegion !== 'all' ||
    activeType !== 'all' || activeIndustry !== '全部行业' || showPremiumOnly
  );

  const activeCountryData = countries.find(c => c.id === activeCountry);

  return (
    <SiteLayout>
      <StatsBar opps={allOpps} countries={countries} />

      {/* Page Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-stone-900 mb-1.5 flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                商机广场
              </h1>
              <p className="text-stone-500">
                {activeCountryData
                  ? `${activeCountryData.nameZh} · ${activeCountryData.summary}`
                  : '汇聚亚洲13国优质商机，帮您找到海外代理商、渠道商与合作伙伴'}
              </p>
            </div>

            {/* Search */}
            <div className="w-full lg:w-96">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索商机标题、企业、行业..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-stone-400"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Layout: Sidebar + Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Country Sidebar */}
          <CountrySidebar
            countries={countries}
            activeCountry={activeCountry}
            onCountryChange={(c) => { setActiveCountry(c); setActiveRegion('all'); }}
            oppCountByCountry={oppCountByCountry}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Region filter (if country selected) */}
            {activeCountry !== 'all' && (
              <div className="mb-4 bg-stone-50 rounded-xl border border-stone-200 p-3">
                <p className="text-xs font-semibold text-stone-500 mb-2 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  选择经济圈 / 省份
                </p>
                <RegionFilter
                  country={activeCountry}
                  countries={countries}
                  activeRegion={activeRegion}
                  onRegionChange={setActiveRegion}
                />
              </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-4">
              {/* Type filters */}
              <div className="mb-3">
                <p className="text-[11px] font-semibold text-stone-400 mb-2 uppercase tracking-wider flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  商机类型
                </p>
                <div className="flex flex-wrap gap-2">
                  {TYPE_FILTERS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setActiveType(f.value)}
                      className={cn(
                        'px-3 py-1.5 text-sm font-medium rounded-lg border transition-all flex items-center gap-1.5',
                        activeType === f.value
                          ? 'bg-blue-800 text-white border-blue-800 shadow-sm'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-blue-200 hover:bg-blue-50'
                      )}
                    >
                      {f.icon}
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Industry + Controls row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
                {/* Industry pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide max-w-[600px]">
                  {industries.map(ind => (
                    <button
                      key={ind}
                      onClick={() => setActiveIndustry(ind)}
                      className={cn(
                        'px-3 py-1 text-xs font-medium rounded-full border transition-all flex-shrink-0',
                        activeIndustry === ind
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                      )}
                    >
                      {ind}
                    </button>
                  ))}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Sort */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-stone-400">排序</span>
                    <select
                      value={activeSort}
                      onChange={e => setActiveSort(e.target.value)}
                      className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {SORT_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Premium toggle */}
                  <button
                    onClick={() => setShowPremiumOnly(!showPremiumOnly)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
                      showPremiumOnly
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-sm'
                        : 'bg-white text-stone-500 border-stone-200 hover:border-amber-200 hover:bg-amber-50'
                    )}
                  >
                    <span>⭐</span>
                    <span>仅优选</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-stone-500">
                共 <span className="font-bold text-stone-800 text-base">{filtered.length}</span> 条商机
                {activeCountry !== 'all' && activeCountryData && (
                  <span className="ml-2 text-stone-400">
                    · <span className="mr-0.5">{activeCountryData.flag}</span>
                    {activeCountryData.nameZh} <span className="text-stone-400">活跃</span>
                  </span>
                )}
              </p>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCountry('all');
                    setActiveRegion('all');
                    setActiveType('all');
                    setActiveIndustry('全部行业');
                    setShowPremiumOnly(false);
                  }}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  重置
                </button>
              )}
            </div>

            {/* Cards Grid */}
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(opp => <OpportunityCard key={opp.id} opp={opp} />)}
              </div>
            ) : (
              <EmptyState hasFilters={hasActiveFilters} />
            )}

            {/* CTA Banner */}
            {filtered.length > 0 && (
              <div className="mt-8 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 rounded-2xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
                <div>
                  <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                    <span>🚀</span>
                    发布您的商机信息
                  </h3>
                  <p className="text-blue-300 text-sm">
                    让亚洲13国企业主动找到您，快速拓展商业版图
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-red-400 border-2 border-white flex items-center justify-center text-xs text-white font-bold">日</div>
                    <div className="w-8 h-8 rounded-full bg-blue-400 border-2 border-white flex items-center justify-center text-xs text-white font-bold">韩</div>
                    <div className="w-8 h-8 rounded-full bg-red-400 border-2 border-white flex items-center justify-center text-xs text-white font-bold">越</div>
                    <div className="w-8 h-8 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center text-xs text-white font-bold">新</div>
                  </div>
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-blue-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-lg"
                  >
                    发布商机
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSubmitModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <span>📝</span> 发布商机
              </h2>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const data = {
                title: fd.get('title'),
                description: fd.get('description'),
                type: fd.get('type'),
                country: fd.get('country'),
                region: fd.get('region'),
                industry: fd.get('industry'),
                companyName: fd.get('companyName'),
                contactEmail: fd.get('contactEmail'),
                amount: fd.get('amount'),
                currency: fd.get('currency'),
              };

              try {
                const res = await fetch('/api/opportunities', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                });
                const result = await res.json();
                if (result.success) {
                  alert('商机提交成功！审核通过后将展示。');
                  setShowSubmitModal(false);
                  window.location.reload();
                } else {
                  alert('提交失败: ' + result.error);
                }
              } catch {
                alert('提交失败，请稍后重试');
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">商机标题 *</label>
                <input name="title" required className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" placeholder="例如：寻求越南家具代理商合作" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">商机类型 *</label>
                  <select name="type" required className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="">选择类型</option>
                    <option value="supply">供应信息</option>
                    <option value="demand">采购需求</option>
                    <option value="investment">投资项目</option>
                    <option value="cooperation">合作洽谈</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">目标市场 *</label>
                  <select name="country" required className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="">选择国家</option>
                    {countries.map(c => (
                      <option key={c.id} value={c.id}>{c.flag} {c.nameZh}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">所属行业 *</label>
                  <input name="industry" required className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="例如：制造业" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">企业名称 *</label>
                  <input name="companyName" required className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="公司全称" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">联系邮箱 *</label>
                  <input name="contactEmail" type="email" required className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="business@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">预算金额（万）</label>
                  <input name="amount" className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="面议填0" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">商机描述 *</label>
                <textarea name="description" required rows={4} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" placeholder="详细描述您的商机信息，包括合作方式、预期目标等..." />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowSubmitModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors">
                  以后再说
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors shadow-md">
                  提交商机
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ScrollToTop />

      <style jsx global>{`
        .premium-card-wrap { position: relative; }
        .premium-card-wrap::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(135deg, #fbbf24, #f97316, #fbbf24);
          border-radius: 1rem;
          z-index: -1;
          opacity: 0.5;
          filter: blur(8px);
          animation: premium-glow 2s ease-in-out infinite alternate;
        }
        @keyframes premium-glow {
          from { opacity: 0.3; filter: blur(6px); }
          to { opacity: 0.6; filter: blur(10px); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </SiteLayout>
  );
}
