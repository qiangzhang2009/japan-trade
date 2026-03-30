'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Stats {
  total: number;
  admins: number;
  premium: number;
  members: number;
  viewers: number;
  active: number;
  suspended: number;
}

interface Overview {
  totalOpportunities: number;
  totalCountries: number;
  lastUpdated: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [usersRes, oppRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/opportunities').catch(() => null),
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setStats(data.stats);
        setRecentUsers(data.users.slice(0, 5));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  const cards = [
    {
      label: '总会员数',
      value: stats?.total ?? '—',
      change: null,
      color: 'blue',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      label: '付费会员',
      value: (stats?.premium ?? 0) + (stats?.members ?? 0),
      change: null,
      color: 'purple',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
    },
    {
      label: '管理员',
      value: stats?.admins ?? '—',
      change: null,
      color: 'red',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      label: '活跃账号',
      value: stats?.active ?? '—',
      change: null,
      color: 'green',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      ),
    },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  };

  const roleLabelMap: Record<string, string> = {
    admin: '管理员',
    premium: '付费会员',
    member: '普通会员',
    viewer: '访客',
  };

  const roleColorMap: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    premium: 'bg-purple-100 text-purple-700',
    member: 'bg-blue-100 text-blue-700',
    viewer: 'bg-stone-100 text-stone-600',
  };

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-blue-800 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-stone-900">数据概览</h1>
          <p className="text-stone-500 text-sm mt-1">欢迎回来，{user.companyName || user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/members"
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors"
          >
            管理会员
          </Link>
          <Link
            href="/admin"
            className="px-4 py-2 text-sm font-medium text-stone-600 bg-white hover:bg-stone-50 rounded-lg border border-stone-200 transition-colors"
          >
            商机管理
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map((card) => (
          <div key={card.label} className={`bg-white rounded-xl border ${colorMap[card.color].split(' ').slice(1).join(' ')} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`p-2 rounded-lg ${colorMap[card.color]}`}>
                {card.icon}
              </span>
            </div>
            <div className="text-3xl font-black text-stone-900 mb-1">{card.value}</div>
            <div className="text-sm text-stone-500">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member breakdown */}
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <h2 className="text-base font-bold text-stone-900 mb-5">会员构成</h2>
          <div className="space-y-4">
            {[
              { label: '管理员', value: stats?.admins ?? 0, color: 'bg-red-500', textColor: 'text-red-700', bg: 'bg-red-50' },
              { label: '付费会员', value: stats?.premium ?? 0, color: 'bg-purple-500', textColor: 'text-purple-700', bg: 'bg-purple-50' },
              { label: '普通会员', value: stats?.members ?? 0, color: 'bg-blue-500', textColor: 'text-blue-700', bg: 'bg-blue-50' },
              { label: '访客', value: stats?.viewers ?? 0, color: 'bg-stone-400', textColor: 'text-stone-600', bg: 'bg-stone-50' },
            ].map((item) => {
              const pct = stats?.total ? ((item.value / stats.total) * 100).toFixed(1) : '0';
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.bg} ${item.textColor}`}>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-900">{item.value}</span>
                      <span className="text-xs text-stone-400">({pct}%)</span>
                    </div>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${pct}%`, minWidth: item.value > 0 ? '4px' : '0' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent registrations */}
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-stone-900">最新注册</h2>
            <Link href="/admin/members" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              查看全部 →
            </Link>
          </div>
          {loadingData ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-stone-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentUsers.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-sm">暂无注册用户</div>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">
                      {u.companyName?.[0] || u.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-900">{u.companyName || '未知公司'}</p>
                      <p className="text-xs text-stone-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColorMap[u.role] || 'bg-stone-100 text-stone-600'}`}>
                      {roleLabelMap[u.role] || u.role}
                    </span>
                    <span className="text-xs text-stone-400">
                      {new Date(u.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-xl border border-stone-200 p-6">
        <h2 className="text-base font-bold text-stone-900 mb-4">快捷操作</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '添加会员', href: '/admin/members', desc: '创建新账号', color: 'blue' },
            { label: '商机管理', href: '/admin', desc: '查看商机数据', color: 'green' },
            { label: '数据统计', href: '/admin/members', desc: '查看数据报表', color: 'purple' },
            { label: '系统设置', href: '/admin/members', desc: '配置平台参数', color: 'stone' },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="p-4 rounded-xl border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all group"
            >
              <div className="text-sm font-bold text-stone-900 mb-1 group-hover:text-blue-800 transition-colors">{action.label}</div>
              <div className="text-xs text-stone-400">{action.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
