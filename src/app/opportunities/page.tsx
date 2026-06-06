'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import opportunitiesData from '@/data/opportunities.json';
import { COUNTRIES } from '@/lib/countries';
import { Opportunity } from '@/types';
import { Search, Filter, ArrowRight, Flame, Star, Clock, MapPin } from 'lucide-react';

const ALL = opportunitiesData as Opportunity[];

const TYPES = [
  { value: 'all', label: '全部类型' },
  { value: 'demand', label: '采购需求' },
  { value: 'supply', label: '供应合作' },
  { value: 'distribution', label: '代理分销' },
  { value: 'investment', label: '投资合资' },
  { value: 'partnership', label: '战略合作' },
];

const TYPE_COLORS: Record<string, string> = {
  demand:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
  supply:       'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  distribution: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  investment:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  partnership:  'bg-pink-500/10 text-pink-400 border-pink-500/20',
};

const TYPE_LABELS: Record<string, string> = {
  demand: '采购需求', supply: '供应合作',
  distribution: '代理分销', investment: '投资合资', partnership: '战略合作',
};

const URGENCY_ICON = {
  hot:  { icon: Flame, label: '热门', color: 'text-red-400' },
  new:  { icon: Star, label: '新发布', color: 'text-brand-400' },
  normal: { icon: Clock, label: '进行中', color: 'text-gray-500' },
};

export default function OpportunitiesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');

  const filtered = useMemo(() => {
    return ALL.filter((op) => {
      const matchSearch = !search ||
        op.title.includes(search) ||
        op.description.includes(search) ||
        op.industry.includes(search);
      const matchType = typeFilter === 'all' || op.type === typeFilter;
      const matchCountry = countryFilter === 'all' || op.country === countryFilter;
      return matchSearch && matchType && matchCountry;
    });
  }, [search, typeFilter, countryFilter]);

  const countriesWithOp = COUNTRIES.filter((c) =>
    ALL.some((op) => op.country === c.id)
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0a0a0f] pt-20">
        {/* Header */}
        <div className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-950 to-[#0a0a0f]" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 60% 50%, rgba(139,82,236,0.08) 0%, transparent 60%)' }} />
          <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">商机广场</h1>
            <p className="text-gray-400 text-lg">汇聚亚洲优质商机，精准匹配合作伙伴</p>
            <div className="flex justify-center gap-6 mt-6 text-sm text-gray-500">
              <span>共 <strong className="text-white">{ALL.length}</strong> 个商机</span>
              <span>覆盖 <strong className="text-white">{countriesWithOp.length}</strong> 个市场</span>
            </div>
          </div>
        </div>

        {/* Filters + Grid */}
        <div className="max-w-6xl mx-auto px-4 pb-20">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 shrink-0 space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="搜索商机..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500/50 transition-colors"
                />
              </div>

              {/* Type Filter */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-300">商机类型</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTypeFilter(t.value)}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        typeFilter === t.value
                          ? 'bg-brand-600 text-white font-medium'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Country Filter */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-300">目标市场</span>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setCountryFilter('all')}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      countryFilter === 'all'
                        ? 'bg-brand-600 text-white font-medium'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    全部市场
                  </button>
                  {COUNTRIES.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCountryFilter(c.id)}
                      className={`flex items-center gap-2 text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        countryFilter === c.id
                          ? 'bg-brand-600 text-white font-medium'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>{c.flag}</span>
                      <span>{c.nameZh}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Cards Grid */}
            <div className="flex-1">
              {filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <p className="text-lg">未找到匹配的商机</p>
                  <button onClick={() => { setSearch(''); setTypeFilter('all'); setCountryFilter('all'); }}
                    className="mt-4 text-brand-400 hover:text-brand-300 font-medium">
                    清除筛选条件
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filtered.map((op) => {
                    const country = COUNTRIES.find((c) => c.id === op.country);
                    const urgency = URGENCY_ICON[op.urgency];
                    const UrgIcon = urgency.icon;
                    return (
                      <article key={op.id} className="group p-5 rounded-2xl bg-white/[0.04] border border-white/5 hover:border-brand-500/30 transition-all hover:-translate-y-0.5">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {country && <span className="text-xl">{country.flag}</span>}
                            <span className={`px-2.5 py-0.5 rounded-full text-xs border ${TYPE_COLORS[op.type] || 'bg-white/5 text-gray-400 border-white/10'}`}>
                              {TYPE_LABELS[op.type] || op.type}
                            </span>
                          </div>
                          <span className={`flex items-center gap-1 text-xs ${urgency.color}`}>
                            <UrgIcon className="w-3 h-3" />
                            {urgency.label}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-white text-base mb-2 leading-snug group-hover:text-brand-300 transition-colors">
                          {op.title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-gray-500 leading-relaxed mb-3 line-clamp-2">
                          {op.description}
                        </p>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-2 py-0.5 rounded-md text-xs bg-white/5 text-gray-400 border border-white/5">
                            {op.industry}
                          </span>
                          {op.budgetRange && (
                            <span className="px-2 py-0.5 rounded-md text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {op.budgetRange}
                            </span>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <div className="text-xs text-gray-600">
                            {op.publishedAt}
                          </div>
                          <Link href="/contact" className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">
                            获取详情 <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
