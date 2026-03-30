'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, ROLE_LABELS, ROLE_COLORS, STATUS_COLORS } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface MemberUser {
  id: string;
  email: string;
  companyName: string;
  contactName: string;
  phone: string;
  country: string;
  industry: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string;
  subscription: { planId: string; status: string };
}

interface Stats {
  total: number;
  admins: number;
  premium: number;
  members: number;
  viewers: number;
  active: number;
  suspended: number;
}

const roleColorMap: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  premium: 'bg-purple-100 text-purple-700',
  member: 'bg-blue-100 text-blue-700',
  viewer: 'bg-stone-100 text-stone-600',
};

const statusColorMap: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

export default function MembersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [filter, setFilter] = useState({ role: 'all', status: 'all', search: '' });
  const [selectedUser, setSelectedUser] = useState<MemberUser | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoadingData(true);
    try {
      const params = new URLSearchParams();
      if (filter.role !== 'all') params.set('role', filter.role);
      if (filter.status !== 'all') params.set('status', filter.status);
      if (filter.search) params.set('search', filter.search);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.users);
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  }, [filter.role, filter.status, filter.search]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
      return;
    }
    if (user?.role === 'admin') {
      fetchMembers();
    }
  }, [user, loading, router, fetchMembers]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchMembers();
    }
  }, [user?.role, fetchMembers]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEdit = (m: MemberUser) => {
    setSelectedUser(m);
    setEditRole(m.role);
    setEditStatus(m.status);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedUser.id, role: editRole, status: editStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('会员信息已更新', true);
        setSelectedUser(null);
        fetchMembers();
      } else {
        showToast(data.error || '更新失败', false);
      }
    } catch {
      showToast('网络错误', false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(id);
  };

  const confirmDeleteUser = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users?id=${confirmDelete}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('会员已删除', true);
        setConfirmDelete(null);
        fetchMembers();
      } else {
        showToast(data.error || '删除失败', false);
      }
    } catch {
      showToast('网络错误', false);
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-stone-900">会员管理</h1>
          <p className="text-stone-500 text-sm mt-1">
            共 {stats?.total ?? '—'} 名会员，其中 {stats?.active ?? 0} 名活跃
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: '管理员', val: stats?.admins ?? 0, cls: 'bg-red-50 border-red-100 text-red-700' },
          { label: '付费会员', val: stats?.premium ?? 0, cls: 'bg-purple-50 border-purple-100 text-purple-700' },
          { label: '普通会员', val: stats?.members ?? 0, cls: 'bg-blue-50 border-blue-100 text-blue-700' },
          { label: '访客', val: stats?.viewers ?? 0, cls: 'bg-stone-50 border-stone-200 text-stone-600' },
          { label: '已停用', val: stats?.suspended ?? 0, cls: 'bg-red-50 border-red-100 text-red-600' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.cls}`}>
            <div className="text-2xl font-black">{s.val}</div>
            <div className="text-xs mt-0.5 opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-stone-500">角色：</label>
            <select
              value={filter.role}
              onChange={(e) => setFilter({ ...filter, role: e.target.value })}
              className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            >
              <option value="all">全部</option>
              <option value="admin">管理员</option>
              <option value="premium">付费会员</option>
              <option value="member">普通会员</option>
              <option value="viewer">访客</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-stone-500">状态：</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            >
              <option value="all">全部</option>
              <option value="active">活跃</option>
              <option value="suspended">已停用</option>
              <option value="pending">待审核</option>
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <input
              type="text"
              placeholder="搜索公司名、邮箱、联系人..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </div>
          <div className="text-sm text-stone-400">
            共 {members.length} 条结果
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">会员信息</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">角色</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">状态</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">注册时间</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">最后登录</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loadingData ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="h-5 w-48 bg-stone-100 rounded animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-20 bg-stone-100 rounded animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-16 bg-stone-100 rounded animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-24 bg-stone-100 rounded animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-24 bg-stone-100 rounded animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-16 bg-stone-100 rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-stone-400 text-sm">暂无符合条件的会员</td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                          {m.companyName?.[0] || m.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-stone-900">{m.companyName || '未知公司'}</p>
                          <p className="text-xs text-stone-400">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${roleColorMap[m.role] || 'bg-stone-100 text-stone-600'}`}>
                        {ROLE_LABELS[m.role] || m.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColorMap[m.status] || 'bg-stone-100 text-stone-600'}`}>
                        {m.status === 'active' ? '活跃' : m.status === 'suspended' ? '已停用' : '待审核'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-500">
                      {new Date(m.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-500">
                      {new Date(m.lastLogin).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(m)}
                          className="text-xs px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                        >
                          编辑
                        </button>
                        {m.id !== user.id && (
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-stone-900 mb-1">编辑会员</h3>
            <p className="text-sm text-stone-500 mb-5">修改 {selectedUser.companyName || selectedUser.email} 的权限</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">邮箱</label>
                <div className="px-3.5 py-2.5 text-sm text-stone-500 bg-stone-50 rounded-lg border border-stone-200">
                  {selectedUser.email}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">角色</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="admin">管理员</option>
                    <option value="premium">付费会员</option>
                    <option value="member">普通会员</option>
                    <option value="viewer">访客</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">状态</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="active">活跃</option>
                    <option value="suspended">已停用</option>
                    <option value="pending">待审核</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">公司名称</label>
                <div className="px-3.5 py-2.5 text-sm text-stone-500 bg-stone-50 rounded-lg border border-stone-200">
                  {selectedUser.companyName || '—'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">国家/地区</label>
                  <div className="px-3.5 py-2.5 text-sm text-stone-500 bg-stone-50 rounded-lg border border-stone-200">
                    {selectedUser.country || '—'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">行业</label>
                  <div className="px-3.5 py-2.5 text-sm text-stone-500 bg-stone-50 rounded-lg border border-stone-200">
                    {selectedUser.industry || '—'}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-2.5 text-sm font-medium text-stone-600 bg-stone-50 hover:bg-stone-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-xl transition-colors disabled:opacity-60"
              >
                {saving ? '保存中...' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-stone-900 text-center mb-2">确认删除</h3>
            <p className="text-sm text-stone-500 text-center mb-6">
              删除后该会员将无法登录，所有数据将被清除，此操作不可恢复。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 text-sm font-medium text-stone-600 bg-stone-50 hover:bg-stone-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-60"
              >
                {saving ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-sm font-medium z-50 animate-fade-in ${toast.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
