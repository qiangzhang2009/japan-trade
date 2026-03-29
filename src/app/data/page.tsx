'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SiteLayout from '@/components/layout/SiteLayout';
import AdBanner from '@/components/ads/AdBanner';
import { formatCurrency, getTrendColor, getTrendIcon, cn } from '@/lib/utils';
import type { TradeData } from '@/types';

type SortKey = 'productName' | 'cnExport' | 'jpExport' | 'trendPercent';

function TradeDataTable() {
  const [allData, setAllData] = useState<TradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('cnExport');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetch('/data/trade-data.json')
      .then((r) => r.json())
      .then((data) => {
        setAllData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = allData
    .filter((d) =>
      d.productName.includes(search) ||
      d.hsCode.includes(search) ||
      d.productNameJp.includes(search)
    )
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'productName') cmp = a.productName.localeCompare(b.productName);
      else if (sortKey === 'cnExport') cmp = a.cnExport - b.cnExport;
      else if (sortKey === 'jpExport') cmp = a.jpExport - b.jpExport;
      else if (sortKey === 'trendPercent') cmp = Math.abs(a.trendPercent) - Math.abs(b.trendPercent);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 text-stone-300">{sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
  );

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      {/* Search & Controls */}
      <div className="p-5 border-b border-stone-200 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="搜索商品名称、HS编码..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400">排序：</span>
          <button
            onClick={() => handleSort('cnExport')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
              sortKey === 'cnExport' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'border-stone-200 text-stone-500'
            )}
          >
            中国出口 <SortIcon col="cnExport" />
          </button>
          <button
            onClick={() => handleSort('jpExport')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
              sortKey === 'jpExport' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'border-stone-200 text-stone-500'
            )}
          >
            日本出口 <SortIcon col="jpExport" />
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-8 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-stone-50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">商品</th>
                <th
                  onClick={() => handleSort('cnExport')}
                  className="text-right px-4 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
                >
                  中国出口(万美元) <SortIcon col="cnExport" />
                </th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">中国进口</th>
                <th
                  onClick={() => handleSort('jpExport')}
                  className="text-right px-4 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
                >
                  日本出口 <SortIcon col="jpExport" />
                </th>
                <th className="text-right px-4 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">日本进口</th>
                <th
                  onClick={() => handleSort('trendPercent')}
                  className="text-right px-4 py-3.5 text-xs font-semibold text-stone-500 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors"
                >
                  趋势 <SortIcon col="trendPercent" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-xs font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded mr-2">
                      HS {item.hsCode}
                    </span>
                    <span className="text-sm font-semibold text-stone-800">{item.productName}</span>
                    <p className="text-xs text-stone-400 mt-0.5">{item.productNameJp}</p>
                  </td>
                  <td className="text-right px-4 py-4">
                    <span className="text-sm font-bold text-stone-800">{formatCurrency(item.cnExport, 'USD')}</span>
                  </td>
                  <td className="text-right px-4 py-4">
                    <span className="text-sm font-bold text-stone-600">{formatCurrency(item.cnImport, 'USD')}</span>
                  </td>
                  <td className="text-right px-4 py-4">
                    <span className="text-sm font-bold text-stone-800">{formatCurrency(item.jpExport, 'USD')}</span>
                  </td>
                  <td className="text-right px-4 py-4">
                    <span className="text-sm font-bold text-stone-600">{formatCurrency(item.jpImport, 'USD')}</span>
                  </td>
                  <td className="text-right px-4 py-4">
                    <div className={cn('text-lg font-black', getTrendColor(item.trend))}>
                      {getTrendIcon(item.trend)}
                    </div>
                    <span className={cn(
                      'text-xs font-semibold',
                      item.trend === 'up' ? 'text-emerald-600' : item.trend === 'down' ? 'text-red-500' : 'text-stone-500'
                    )}>
                      {item.trend === 'up' ? '+' : ''}{item.trendPercent}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-stone-400">未找到匹配的商品数据</p>
        </div>
      )}
    </div>
  );
}

export default function DataPage() {
  return (
    <SiteLayout>
      {/* Page Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-black text-stone-900 mb-2">贸易数据</h1>
          <p className="text-stone-500">中日海关进出口统计，实时追踪双边贸易趋势</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '2026年2月统计', value: '最新数据', icon: '📅' },
            { label: '中国对日出口', value: '¥125.4亿', sub: '同比+8.3%', icon: '🇨🇳', color: 'text-red-600' },
            { label: '日本对中出口', value: '¥45.6亿', sub: '同比+12.1%', icon: '🇯🇵', color: 'text-blue-600' },
            { label: '贸易总额趋势', value: '↑ 上升中', sub: '连续3个月增长', icon: '📈', color: 'text-emerald-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-stone-200 p-5">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <p className="text-xs text-stone-400 mb-1">{stat.label}</p>
              <p className={cn('text-xl font-black', stat.color ?? 'text-stone-900')}>{stat.value}</p>
              {stat.sub && <p className="text-xs text-emerald-600 font-medium mt-0.5">{stat.sub}</p>}
            </div>
          ))}
        </div>

        {/* Data Table */}
        <TradeDataTable />

        <AdBanner />

        {/* API Section */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-8 text-white">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-semibold text-blue-300 mb-4">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                数据 API
              </div>
              <h3 className="text-xl font-bold mb-2">接入中日贸易数据 API</h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                通过 API 接口获取实时海关进出口数据，支持 Webhook 推送、批量查询、历史数据回溯。专业版及以上用户可用。
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="bg-stone-800/50 rounded-lg p-3 font-mono text-xs text-stone-300">
                GET /api/v1/trade-data?hs=8471&month=2026-02
              </div>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-stone-900 bg-white hover:bg-blue-50 rounded-lg transition-colors"
              >
                申请 API 访问
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
