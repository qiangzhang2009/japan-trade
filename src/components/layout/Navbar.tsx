'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: '首页', labelJp: 'ホーム' },
  { href: '/news', label: '经贸资讯', labelJp: '经贸ニュース' },
  { href: '/data', label: '贸易数据', labelJp: '貿易データ' },
  { href: '/opportunities', label: '商机广场', labelJp: 'ビジネス情報' },
  { href: '/pricing', label: '会员服务', labelJp: 'メンバーサービス' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-stone-200/60">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white font-bold text-sm">中</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-base font-bold tracking-tight text-stone-900">
                中日经贸通
              </div>
              <div className="text-[10px] text-stone-500 leading-none font-medium">
                China Japan Trade
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    'flex flex-col items-center leading-none gap-0.5',
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  )}
                >
                  <span>{item.label}</span>
                  <span className={cn(
                    'text-[10px] font-normal',
                    isActive ? 'text-blue-500' : 'text-stone-400'
                  )}>
                    {item.labelJp}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>搜索</span>
            </button>
            <Link
              href="/pricing"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              立即加入
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-stone-200/60">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5',
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-stone-600 hover:bg-stone-100'
                  )}
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-stone-400">{item.labelJp}</span>
                </Link>
              );
            })}
            <div className="mt-3 pt-3 border-t border-stone-200/60">
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg"
              >
                立即加入
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
