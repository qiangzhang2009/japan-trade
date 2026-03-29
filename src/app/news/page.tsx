'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SiteLayout from '@/components/layout/SiteLayout';
import AdBanner from '@/components/ads/AdBanner';
import { formatRelativeTime, getCategoryLabel, getCountryLabel, cn } from '@/lib/utils';
import type { NewsArticle } from '@/types';

const categories = [
  { value: 'all', label: '全部', labelJp: 'すべて' },
  { value: 'policy', label: '政策法规', labelJp: '政策・法規' },
  { value: 'trade', label: '贸易动态', labelJp: '貿易動向' },
  { value: 'industry', label: '行业观察', labelJp: '業界観察' },
  { value: 'market', label: '市场行情', labelJp: '市場行情' },
  { value: 'event', label: '展会活动', labelJp: '展示会' },
];

const countries = [
  { value: 'all', label: '全部来源' },
  { value: 'bilateral', label: '中日双边' },
  { value: 'cn', label: '中国' },
  { value: 'jp', label: '日本' },
];

function NewsCard({ article, featured = false }: { article: NewsArticle; featured?: boolean }) {
  return (
    <article className={`group ${featured ? 'lg:col-span-2' : ''}`}>
      <Link href={`/news/${article.id}`} className="block h-full">
        <div className={cn(
          'bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300 h-full',
          featured ? 'flex flex-col sm:flex-row' : 'flex flex-col'
        )}>
          <div className={cn(
            'bg-gradient-to-br from-blue-100 via-purple-50 to-amber-50 flex items-center justify-center flex-shrink-0',
            featured ? 'sm:w-2/5 min-h-40' : 'h-36'
          )}>
            <div className="text-center">
              <div className="text-5xl font-black text-blue-200">{getCategoryLabel(article.category)[0]}</div>
            </div>
          </div>
          <div className={cn('p-5 flex flex-col justify-between', featured ? 'sm:w-3/5' : '')}>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                  {getCategoryLabel(article.category)}
                </span>
                <span className={cn(
                  'px-2 py-0.5 text-[11px] font-medium rounded-full border',
                  article.country === 'bilateral' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                  article.country === 'cn' ? 'bg-red-50 text-red-600 border-red-100' :
                  'bg-blue-50 text-blue-600 border-blue-100'
                )}>
                  {getCountryLabel(article.country)}
                </span>
                <span className="text-[11px] text-stone-400">{article.source}</span>
              </div>
              <h3 className={cn(
                'font-bold text-stone-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors',
                featured ? 'text-lg' : 'text-base'
              )}>
                {article.title}
              </h3>
              <p className="text-sm text-stone-500 leading-relaxed line-clamp-2">
                {article.summary}
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {article.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[11px] text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
              <span className="text-xs text-stone-400">
                {formatRelativeTime(article.publishedAt)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeCountry, setActiveCountry] = useState('all');
  const [allNews, setAllNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/news.json')
      .then((r) => r.json())
      .then((data) => {
        setAllNews(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const filtered = allNews.filter((n) => {
    const categoryMatch = activeCategory === 'all' || n.category === activeCategory;
    const countryMatch = activeCountry === 'all' || n.country === activeCountry;
    return categoryMatch && countryMatch;
  });

  return (
    <SiteLayout>
      {/* Page Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-black text-stone-900 mb-2">经贸资讯</h1>
          <p className="text-stone-500">中日双边贸易资讯、政策动态与行业观察，每日更新</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  'px-3.5 py-1.5 text-sm font-medium rounded-lg border transition-all',
                  activeCategory === cat.value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-blue-200 hover:text-blue-600'
                )}
              >
                <span>{cat.label}</span>
                <span className="ml-1.5 text-xs opacity-60">{cat.labelJp}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            {countries.map((c) => (
              <button
                key={c.value}
                onClick={() => setActiveCountry(c.value)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-lg border transition-all',
                  activeCountry === c.value
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-stone-400 mb-6">
          共找到 <span className="font-semibold text-stone-600">{filtered.length}</span> 条资讯
        </p>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 animate-pulse">
                <div className="h-36 bg-stone-100 rounded-xl mb-4" />
                <div className="h-4 bg-stone-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-stone-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* News Grid */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filtered.map((article, i) => (
              <NewsCard
                key={article.id}
                article={article}
                featured={i === 0 && activeCategory === 'all' && activeCountry === 'all'}
              />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 text-stone-200">📰</div>
            <p className="text-stone-500">暂无符合条件的资讯</p>
          </div>
        )}

        <AdBanner className="mt-12" />
      </div>
    </SiteLayout>
  );
}
