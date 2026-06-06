'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Globe, Menu, X, Zap } from 'lucide-react';

const NAV = [
  { href: '/', label: '首页', en: 'Home' },
  { href: '/opportunities', label: '商机广场', en: 'Opportunities' },
  { href: '/market/jp', label: '市场洞察', en: 'Market' },
  { href: '/about', label: '关于我们', en: 'About' },
  { href: '/contact', label: '联系我们', en: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-purple-900/20'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-600/40 group-hover:shadow-brand-500/60 transition-shadow">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg leading-none block">出海通</span>
            <span className="text-brand-400 text-[10px] tracking-widest uppercase leading-none mt-0.5 block">AsiaBridge</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/contact"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white text-sm font-medium hover:from-brand-500 hover:to-brand-600 transition-all shadow-lg shadow-brand-700/30 hover:shadow-brand-600/40"
          >
            <Zap className="w-4 h-4" />
            免费咨询
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10">
          <ul className="px-4 py-3 space-y-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  {item.label}
                  <span className="text-gray-600 text-xs">{item.en}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 mt-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-medium"
              >
                <Zap className="w-4 h-4" />
                免费咨询
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
