'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import SiteLayout from '@/components/layout/SiteLayout';
import { formatRelativeTime, getOpportunityTypeLabel, getCountryLabel, cn } from '@/lib/utils';
import type { BusinessOpportunity } from '@/types';

const typeFilters = [
  { value: 'all', label: '全部类型', icon: '📋' },
  { value: 'supply', label: '供应信息', icon: '⚡' },
  { value: 'demand', label: '采购需求', icon: '📦' },
  { value: 'investment', label: '投资项目', icon: '💰' },
  { value: 'cooperation', label: '合作洽谈', icon: '🤝' },
];

const countryFilters = [
  { value: 'all', label: '全部地区', flag: '🌐' },
  { value: 'cn', label: '来自中国', flag: '🇨🇳' },
  { value: 'jp', label: '来自日本', flag: '🇯🇵' },
  { value: 'bilateral', label: '中日合作', flag: '🌏' },
];

const sortOptions = [
  { value: 'latest', label: '最新发布', icon: '🕐' },
  { value: 'budget', label: '预算最高', icon: '💵' },
  { value: 'expiring', label: '即将到期', icon: '⏰' },
];

function getDaysRemaining(expiresAt: string): number {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    supply: '⚡',
    demand: '📦',
    investment: '💰',
    cooperation: '🤝',
  };
  return icons[type] ?? '📋';
}

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    cn: '🇨🇳',
    jp: '🇯🇵',
    bilateral: '🌏',
  };
  return flags[country] ?? '🌐';
}

function OpportunityCard({ opp }: { opp: BusinessOpportunity }) {
  const daysRemaining = getDaysRemaining(opp.expiresAt);
  const isUrgent = daysRemaining <= 7 && daysRemaining > 0;
  const isExpiringSoon = daysRemaining <= 3 && daysRemaining > 0;

  return (
    <article className={cn(
      'group relative transition-all duration-300',
      opp.isPremium && 'premium-card'
    )}>
      <Link href={`/opportunities/${opp.id}`} className="block h-full">
        <div className={cn(
          'bg-white rounded-2xl border p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative overflow-hidden',
          opp.isPremium
            ? 'border-amber-300 shadow-amber-100'
            : 'border-stone-200 hover:border-blue-200'
        )}>
          {/* Premium Glow Effect */}
          {opp.isPremium && (
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-orange-50/50 pointer-events-none" />
          )}

          {/* Header */}
          <div className="flex items-start justify-between mb-3 gap-2 relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Badge with Icon */}
              <span className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full border',
                opp.type === 'supply' && 'bg-blue-50 text-blue-600 border-blue-100',
                opp.type === 'demand' && 'bg-amber-50 text-amber-600 border-amber-100',
                opp.type === 'investment' && 'bg-purple-50 text-purple-600 border-purple-100',
                opp.type === 'cooperation' && 'bg-emerald-50 text-emerald-600 border-emerald-100'
              )}>
                <span>{getTypeIcon(opp.type)}</span>
                <span>{getOpportunityTypeLabel(opp.type)}</span>
              </span>

              {/* Premium Badge */}
              {opp.isPremium && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-sm animate-pulse">
                  <span>✨</span>
                  <span>优选</span>
                </span>
              )}
            </div>

            {/* Country Flag */}
            <div className="flex items-center gap-1.5">
              <span className="text-base">{getCountryFlag(opp.country)}</span>
              <span className={cn(
                'px-2 py-0.5 text-[10px] font-medium rounded-full',
                opp.country === 'cn' && 'bg-red-50 text-red-600',
                opp.country === 'jp' && 'bg-blue-50 text-blue-600',
                opp.country === 'bilateral' && 'bg-purple-50 text-purple-600'
              )}>
                {getCountryLabel(opp.country)}
              </span>
            </div>
          </div>

          {/* Industry Tag */}
          <div className="mb-3 relative z-10">
            <span className="inline-block px-2.5 py-1 text-[10px] font-medium rounded-full bg-stone-100 text-stone-600 border border-stone-200">
              {opp.industry}
            </span>
          </div>

          {/* Title */}
          <h3 className={cn(
            'font-bold leading-snug mb-2 relative z-10 group-hover:text-blue-600 transition-colors',
            opp.isPremium ? 'text-stone-900' : 'text-stone-800'
          )}>
            {opp.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-stone-500 leading-relaxed line-clamp-2 flex-1 relative z-10">
            {opp.description}
          </p>

          {/* Budget & Company Info */}
          <div className="mt-4 pt-3 border-t border-stone-100 relative z-10">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-stone-400 mb-0.5">{opp.industry}</p>
                <p className="font-semibold text-stone-700 truncate">{opp.companyName}</p>
                {opp.region && (
                  <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1">
                    <span>📍</span>
                    <span>{opp.region}</span>
                  </p>
                )}
              </div>

              {opp.amount && (
                <div className="text-right flex-shrink-0 bg-stone-50 rounded-lg px-2.5 py-1.5">
                  <p className="text-[10px] text-stone-400">预算</p>
                  <p className="text-sm font-black text-blue-600">{opp.amount}</p>
                  {opp.currency && (
                    <p className="text-[10px] text-stone-400">{opp.currency}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              {/* Status Badge */}
              <span className={cn(
                'px-2 py-0.5 text-[11px] font-medium rounded-full border flex items-center gap-1',
                opp.status === 'active'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  : opp.status === 'pending'
                  ? 'bg-amber-50 text-amber-600 border-amber-100'
                  : 'bg-stone-100 text-stone-500 border-stone-200'
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {opp.status === 'active' ? '招募中' : opp.status === 'pending' ? '待审核' : '已结束'}
              </span>

              {/* Urgent Badge */}
              {isUrgent && (
                <span className={cn(
                  'px-2 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1',
                  isExpiringSoon
                    ? 'bg-red-100 text-red-600'
                    : 'bg-amber-100 text-amber-600'
                )}>
                  ⏰ {daysRemaining}天
                </span>
              )}
            </div>

            {/* Posted Time */}
            <span className="text-xs text-stone-400">
              {formatRelativeTime(opp.publishedAt)}
            </span>
          </div>
        </div>
      </Link>

      {/* Apply Button */}
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
          申请对接
          <span>→</span>
        </span>
      </Link>
    </article>
  );
}

function StatsBar({ opps }: { opps: BusinessOpportunity[] }) {
  const stats = useMemo(() => {
    const total = opps.length;
    const byType = opps.reduce((acc, o) => {
      acc[o.type] = (acc[o.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byCountry = opps.reduce((acc, o) => {
      acc[o.country] = (acc[o.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, byType, byCountry };
  }, [opps]);

  return (
    <div className="bg-gradient-to-r from-stone-800 via-stone-900 to-stone-800 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-stone-400">全部商机</span>
            <span className="font-bold text-white text-lg">{stats.total}</span>
          </div>

          <div className="w-px h-6 bg-stone-700 hidden sm:block" />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-blue-400">⚡</span>
              <span className="text-stone-300">供应</span>
              <span className="font-bold text-white">{stats.byType.supply || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400">📦</span>
              <span className="text-stone-300">采购</span>
              <span className="font-bold text-white">{stats.byType.demand || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-purple-400">💰</span>
              <span className="text-stone-300">投资</span>
              <span className="font-bold text-white">{stats.byType.investment || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400">🤝</span>
              <span className="text-stone-300">合作</span>
              <span className="font-bold text-white">{stats.byType.cooperation || 0}</span>
            </div>
          </div>

          <div className="w-px h-6 bg-stone-700 hidden sm:block" />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>🇨🇳</span>
              <span className="text-stone-300">中国</span>
              <span className="font-bold text-white">{stats.byCountry.cn || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>🇯🇵</span>
              <span className="text-stone-300">日本</span>
              <span className="font-bold text-white">{stats.byCountry.jp || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>🌏</span>
              <span className="text-stone-300">双边</span>
              <span className="font-bold text-white">{stats.byCountry.bilateral || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-lg font-bold text-stone-700 mb-2">
        {hasFilters ? '未找到匹配的商机' : '暂无商机信息'}
      </h3>
      <p className="text-stone-500 mb-6 max-w-md mx-auto">
        {hasFilters
          ? '尝试调整筛选条件或关键词，获取更多商机推荐'
          : '成为第一个发布商机信息的企业，抢占商业先机'}
      </p>
      {hasFilters ? (
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <span>↻</span>
          <span>重置筛选</span>
        </button>
      ) : (
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          立即发布商机
          <span>→</span>
        </Link>
      )}
    </div>
  );
}

function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
      aria-label="滚动到顶部"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  );
}

export default function OpportunitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [activeCountry, setActiveCountry] = useState('all');
  const [activeIndustry, setActiveIndustry] = useState('全部行业');
  const [activeSort, setActiveSort] = useState('latest');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [allOpps, setAllOpps] = useState<BusinessOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Load from URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('type')) setActiveType(params.get('type')!);
      if (params.get('country')) setActiveCountry(params.get('country')!);
      if (params.get('search')) setSearchQuery(params.get('search')!);
    }
  }, []);

  // Update URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      if (activeType !== 'all') params.set('type', activeType);
      if (activeCountry !== 'all') params.set('country', activeCountry);
      if (searchQuery) params.set('search', searchQuery);

      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;

      window.history.replaceState({}, '', newUrl);
    }
  }, [activeType, activeCountry, searchQuery]);

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

  // Get unique industries
  const industries = useMemo(() => {
    const unique = Array.from(new Set(allOpps.map((o) => o.industry)));
    return ['全部行业', ...unique.sort()];
  }, [allOpps]);

  // Filter and sort opportunities
  const filtered = useMemo(() => {
    let result = allOpps.filter((o) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const searchMatch =
        !searchQuery ||
        o.title.toLowerCase().includes(searchLower) ||
        o.description.toLowerCase().includes(searchLower) ||
        o.companyName.toLowerCase().includes(searchLower) ||
        o.industry.toLowerCase().includes(searchLower);

      // Type filter
      const typeMatch = activeType === 'all' || o.type === activeType;

      // Country filter
      const countryMatch = activeCountry === 'all' || o.country === activeCountry;

      // Industry filter
      const industryMatch = activeIndustry === '全部行业' || o.industry === activeIndustry;

      // Premium filter
      const premiumMatch = !showPremiumOnly || o.isPremium;

      return searchMatch && typeMatch && countryMatch && industryMatch && premiumMatch;
    });

    // Sort
    result.sort((a, b) => {
      switch (activeSort) {
        case 'budget':
          // Higher budget first (if available)
          if (a.amount && b.amount) return b.amount.localeCompare(a.amount);
          if (a.amount) return -1;
          if (b.amount) return 1;
          return 0;
        case 'expiring':
          // Soonest expiry first
          return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
        case 'latest':
        default:
          // Most recent first
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
    });

    return result;
  }, [allOpps, searchQuery, activeType, activeCountry, activeIndustry, showPremiumOnly, activeSort]);

  const hasActiveFilters = !!(searchQuery || activeType !== 'all' || activeCountry !== 'all' || activeIndustry !== '全部行业' || showPremiumOnly);

  return (
    <SiteLayout>
      {/* Stats Bar */}
      {!loading && allOpps.length > 0 && <StatsBar opps={allOpps} />}

      {/* Page Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-stone-900 mb-2 flex items-center gap-3">
                <span className="text-2xl">🎯</span>
                商机广场
              </h1>
              <p className="text-stone-500">中日双边贸易合作机会，实时更新，精准匹配</p>
            </div>

            {/* Search Input */}
            <div className="w-full lg:w-96">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索商机标题、描述、企业..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-stone-400"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                  🔍
                </span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filters Row */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-5">
          {/* Type Filters */}
          <div>
            <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider flex items-center gap-2">
              <span>📋</span> 类型
            </p>
            <div className="flex flex-wrap gap-2">
              {typeFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setActiveType(f.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-lg border transition-all flex items-center gap-1.5',
                    activeType === f.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-blue-200 hover:bg-blue-50'
                  )}
                >
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Country Filters */}
          <div>
            <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider flex items-center gap-2">
              <span>🌐</span> 地区
            </p>
            <div className="flex flex-wrap gap-2">
              {countryFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setActiveCountry(f.value)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-lg border transition-all flex items-center gap-1.5',
                    activeCountry === f.value
                      ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                  )}
                >
                  <span>{f.flag}</span>
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Industry Filters - Scrollable */}
          <div>
            <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider flex items-center gap-2">
              <span>🏭</span> 行业
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {industries.map((ind) => (
                <button
                  key={ind}
                  onClick={() => setActiveIndustry(ind)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-lg border transition-all flex-shrink-0',
                    activeIndustry === ind
                      ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                  )}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>

          {/* Sort & Premium Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-stone-100">
            {/* Sort Options */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">排序</span>
              <div className="flex gap-2">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setActiveSort(opt.value)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1',
                      activeSort === opt.value
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-stone-600 border-stone-200 hover:border-purple-200'
                    )}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Premium Toggle */}
            <button
              onClick={() => setShowPremiumOnly(!showPremiumOnly)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all',
                showPremiumOnly
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-sm'
                  : 'bg-white text-stone-500 border-stone-200 hover:border-amber-200 hover:bg-amber-50'
              )}
            >
              <span>✨</span>
              <span>仅显示优选</span>
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm text-stone-500">
              共 <span className="font-bold text-stone-800 text-lg">{filtered.length}</span> 条商机
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveType('all');
                  setActiveCountry('all');
                  setActiveIndustry('全部行业');
                  setShowPremiumOnly(false);
                }}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>↺</span>
                <span>重置</span>
              </button>
            )}
          </div>

          {filtered.length > 0 && (
            <Link
              href="/pricing"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              升级解锁完整商机
              <span>→</span>
            </Link>
          )}
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 animate-pulse">
                <div className="flex gap-2 mb-3">
                  <div className="h-6 bg-stone-100 rounded-full w-20" />
                  <div className="h-6 bg-stone-100 rounded-full w-16" />
                </div>
                <div className="h-4 bg-stone-100 rounded w-3/4 mb-2" />
                <div className="h-4 bg-stone-100 rounded w-1/2 mb-4" />
                <div className="h-16 bg-stone-100 rounded mb-4" />
                <div className="flex justify-between">
                  <div className="h-8 bg-stone-100 rounded w-1/3" />
                  <div className="h-8 bg-stone-100 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Opportunities Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && <EmptyState hasFilters={hasActiveFilters} />}

        {/* CTA Banner */}
        {!loading && filtered.length > 0 && (
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 rounded-2xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div>
              <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                <span>🚀</span>
                发布您的商机信息
              </h3>
              <p className="text-blue-100 text-sm">
                让中日双边企业主动找到您，快速拓展商业版图
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-xs">中</div>
                <div className="w-8 h-8 rounded-full bg-red-400 border-2 border-white flex items-center justify-center text-xs">日</div>
                <div className="w-8 h-8 rounded-full bg-purple-400 border-2 border-white flex items-center justify-center text-xs">韩</div>
              </div>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-blue-700 bg-white hover:bg-blue-50 rounded-xl transition-colors shadow-lg"
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

      {/* Submit Opportunity Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSubmitModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
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
              const formData = new FormData(e.currentTarget);
              const data = {
                title: formData.get('title'),
                description: formData.get('description'),
                type: formData.get('type'),
                country: formData.get('country'),
                industry: formData.get('industry'),
                companyName: formData.get('companyName'),
                contactEmail: formData.get('contactEmail'),
                region: formData.get('region'),
                amount: formData.get('amount'),
                currency: formData.get('currency'),
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
                  // Refresh the page to show new opportunity
                  window.location.reload();
                } else {
                  alert('提交失败: ' + result.error);
                }
              } catch (err) {
                alert('提交失败，请稍后重试');
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">商机标题 *</label>
                <input name="title" required className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="例如：寻求日本高端医疗器械代理" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">商机类型 *</label>
                  <select name="type" required className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">选择类型</option>
                    <option value="supply">供应信息</option>
                    <option value="demand">采购需求</option>
                    <option value="investment">投资项目</option>
                    <option value="cooperation">合作洽谈</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">来源地区 *</label>
                  <select name="country" required className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">选择地区</option>
                    <option value="cn">中国</option>
                    <option value="jp">日本</option>
                    <option value="bilateral">中日合作</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">所属行业 *</label>
                  <input name="industry" required className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="例如：制造业" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">企业名称 *</label>
                  <input name="companyName" required className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="公司全称" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">联系邮箱 *</label>
                  <input name="contactEmail" type="email" required className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="business@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">所在地区</label>
                  <input name="region" className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="如：上海浦东新区" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">商机描述 *</label>
                <textarea name="description" required rows={4} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="详细描述您的商机信息，包括合作方式、预期目标等..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">预算金额</label>
                  <input name="amount" className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="面议或具体金额" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">货币</label>
                  <select name="currency" className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="CNY">人民币 (CNY)</option>
                    <option value="JPY">日元 (JPY)</option>
                    <option value="USD">美元 (USD)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  以后再说
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md"
                >
                  提交商机
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      <ScrollToTopButton />

      {/* Premium Card Animation Styles */}
      <style jsx global>{`
        .premium-card {
          position: relative;
        }
        .premium-card::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(135deg, #fbbf24, #f97316, #fbbf24);
          border-radius: 1rem;
          z-index: -1;
          opacity: 0.6;
          filter: blur(8px);
          animation: premium-glow 2s ease-in-out infinite alternate;
        }
        @keyframes premium-glow {
          from {
            opacity: 0.4;
            filter: blur(6px);
          }
          to {
            opacity: 0.7;
            filter: blur(10px);
          }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </SiteLayout>
  );
}
