'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, ROLE_LABELS } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function MemberDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-8 h-8 rounded-full border-2 border-blue-800 border-t-transparent animate-spin" />
      </div>
    );
  }

  const isPaidMember = user.role === 'premium' || user.role === 'member' || user.role === 'admin';
  const isPremium = user.role === 'premium';
  const isAdmin = user.role === 'admin';

  const features = [
    {
      label: '查看全部商机',
      desc: '查看平台所有商机信息',
      unlocked: isPaidMember || isAdmin,
      icon: '🔍',
    },
    {
      label: '查看付费商机',
      desc: '访问高级付费商机内容',
      unlocked: isPremium || isAdmin,
      icon: '⭐',
    },
    {
      label: '发布商机',
      desc: '在平台发布您的合作需求',
      unlocked: isPaidMember || isAdmin,
      icon: '📤',
    },
    {
      label: '专属客服支持',
      desc: '获得一对一出海咨询服务',
      unlocked: isPremium || isAdmin,
      icon: '💬',
    },
    {
      label: '数据报告下载',
      desc: '下载市场分析报告',
      unlocked: isPremium || isAdmin,
      icon: '📊',
    },
    {
      label: '优先展示推广',
      desc: '您的商机优先推荐给潜在合作方',
      unlocked: isPremium || isAdmin,
      icon: '🚀',
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-200 text-sm mb-1">会员中心</p>
              <h1 className="text-3xl font-black mb-2">
                {user.companyName || '尊敬的用户'}
              </h1>
              <p className="text-blue-200 text-sm mb-4">
                {user.contactName ? `联系人：${user.contactName}` : ''} {user.email}
              </p>
              <div className="flex items-center gap-3">
                <span className={cn(
                  'inline-block text-sm font-semibold px-4 py-1.5 rounded-full',
                  user.role === 'admin' ? 'bg-red-500 text-white' :
                  user.role === 'premium' ? 'bg-purple-500 text-white' :
                  'bg-blue-500 text-white'
                )}>
                  {ROLE_LABELS[user.role] || user.role}
                </span>
                <span className="text-blue-200 text-sm">
                  注册时间：{new Date(user.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-3xl font-black text-white">
                {user.companyName?.[0] || user.email[0].toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account info */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h2 className="text-base font-bold text-stone-900 mb-4">账号信息</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: '公司名称', value: user.companyName || '—' },
                  { label: '联系人', value: user.contactName || '—' },
                  { label: '联系电话', value: user.phone || '—' },
                  { label: '国家/地区', value: user.country || '—' },
                  { label: '所属行业', value: user.industry || '—' },
                  { label: '最后登录', value: new Date(user.lastLogin).toLocaleString('zh-CN') },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-stone-400 mb-1">{item.label}</p>
                    <p className="text-sm font-medium text-stone-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h2 className="text-base font-bold text-stone-900 mb-4">会员权益</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((f) => (
                  <div
                    key={f.label}
                    className={cn(
                      'p-4 rounded-xl border transition-all',
                      f.unlocked
                        ? 'bg-white border-stone-200 hover:border-blue-200 hover:shadow-sm'
                        : 'bg-stone-50 border-stone-100 opacity-60'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">{f.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-stone-900">{f.label}</p>
                          {f.unlocked ? (
                            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Current plan */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h2 className="text-base font-bold text-stone-900 mb-4">当前方案</h2>
              <div className={cn(
                'rounded-xl p-4 text-center mb-4',
                user.role === 'admin' ? 'bg-red-50 border border-red-100' :
                user.role === 'premium' ? 'bg-purple-50 border border-purple-100' :
                user.role === 'member' ? 'bg-blue-50 border border-blue-100' :
                'bg-stone-50 border border-stone-200'
              )}>
                <div className={cn(
                  'text-2xl font-black mb-1',
                  user.role === 'admin' ? 'text-red-700' :
                  user.role === 'premium' ? 'text-purple-700' :
                  user.role === 'member' ? 'text-blue-700' :
                  'text-stone-600'
                )}>
                  {ROLE_LABELS[user.role] || user.role}
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  {user.subscription?.status === 'active' ? '订阅中' : '免费账号'}
                </p>
              </div>
              {!isPaidMember && (
                <Link
                  href="/pricing"
                  className="block w-full py-2.5 text-center text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-xl transition-colors"
                >
                  升级到付费会员
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="block w-full py-2.5 text-center text-sm font-semibold text-white bg-red-700 hover:bg-red-800 rounded-xl transition-colors"
                >
                  进入管理后台
                </Link>
              )}
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-xl border border-stone-200 p-6">
              <h2 className="text-base font-bold text-stone-900 mb-4">快捷链接</h2>
              <div className="space-y-2">
                {[
                  { href: '/opportunities', label: '浏览商机', icon: '🔍' },
                  { href: '/industries', label: '行业版块', icon: '🏭' },
                  { href: '/pricing', label: '会员服务', icon: '💎' },
                  { href: '/about', label: '关于我们', icon: 'ℹ️' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl p-6 text-white">
              <h2 className="text-base font-bold mb-2">需要帮助？</h2>
              <p className="text-blue-200 text-sm leading-relaxed mb-4">
                如有会员相关问题，欢迎联系我们的客服团队。
              </p>
              <a
                href="mailto:customer@zxqconsulting.com"
                className="block text-center text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg py-2.5 transition-colors"
              >
                customer@zxqconsulting.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
