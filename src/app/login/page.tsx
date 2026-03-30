'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const COUNTRIES = [
  '中国', '日本', '韩国', '新加坡', '越南', '印尼', '马来西亚',
  '泰国', '菲律宾', '缅甸', '柬埔寨', '老挝', '文莱', '美国',
  '欧盟', '其他',
];

const INDUSTRIES = [
  '制造业', '科技/互联网', '医疗健康', '金融服务', '教育培训',
  '零售/电商', '物流/运输', '能源/化工', '房地产', '农业/食品',
  '建筑/建材', '纺织/服装', '其他',
];

export default function LoginPage() {
  const router = useRouter();
  const { user, login, register, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isAdminSetup, setIsAdminSetup] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regData, setRegData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    contactName: '',
    phone: '',
    country: '',
    industry: '',
  });

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          fetch('/data/users.json')
            .then((r2) => r2.ok ? r2.json() : null)
            .then((data) => {
              if (!data?.adminInitialSetup) setIsAdminSetup(true);
            })
            .catch(() => setIsAdminSetup(true));
        }
      })
      .catch(() => setIsAdminSetup(true));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await login(loginEmail, loginPassword);
    setSubmitting(false);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || '登录失败');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (regData.password !== regData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (regData.password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }
    setSubmitting(true);
    const result = await register({ ...regData, isFirstAdmin: isAdminSetup });
    setSubmitting(false);
    if (result.success) {
      if (isAdminSetup) {
        router.push('/');
      } else {
        setError('');
        setMode('login');
        setLoginEmail(regData.email);
      }
    } else {
      setError(result.error || '注册失败');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-blue-800 border-t-transparent animate-spin" />
          <p className="text-stone-500 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-blue-600 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <span className="text-white font-black text-lg">出</span>
            </div>
            <div>
              <div className="text-white font-black text-lg leading-none">出海通</div>
              <div className="text-blue-300 text-xs mt-0.5">AsiaBridge</div>
            </div>
          </Link>

          <div className="space-y-8">
            <h1 className="text-4xl font-black text-white leading-tight">
              {isAdminSetup
                ? '设置平台管理员'
                : '连接中国与世界，让出海更简单'}
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed max-w-md">
              {isAdminSetup
                ? '这是首次设置，请创建管理员账号以开始管理平台'
                : '汇聚东南亚、东亚13国真实商机，助力中国企业找到优质海外客户、代理商与合作伙伴。'}
            </p>
            <div className="flex items-center gap-6">
              {[
                { n: '500+', l: '优质商机' },
                { n: '13', l: '目标国家' },
                { n: '24/7', l: '实时更新' },
              ].map((s) => (
                <div key={s.l} className="text-center">
                  <div className="text-2xl font-black text-white">{s.n}</div>
                  <div className="text-blue-300 text-xs mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-blue-400 text-xs">
            &copy; {new Date().getFullYear()} 出海通 AsiaBridge
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16">
        <div className="w-full max-w-md mx-auto space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-900 to-blue-950 flex items-center justify-center">
              <span className="text-white font-black text-sm">出</span>
            </div>
            <div>
              <div className="text-stone-900 font-black text-base leading-none">出海通</div>
              <div className="text-stone-400 text-[10px] leading-none mt-0.5">AsiaBridge</div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-black text-stone-900">
              {isAdminSetup ? '创建管理员账号' : mode === 'login' ? '欢迎回来' : '立即注册'}
            </h2>
            <p className="text-stone-500 text-sm mt-1.5">
              {isAdminSetup
                ? '设置您的管理员账号以管理整个平台'
                : mode === 'login'
                  ? '登录您的账号继续探索商机'
                  : '填写以下信息创建您的免费账号'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {isAdminSetup ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <FormField label="公司/组织名称 *" required>
                <input
                  type="text"
                  value={regData.companyName}
                  onChange={(e) => setRegData({ ...regData, companyName: e.target.value })}
                  placeholder="请输入公司或组织名称"
                  className="form-input"
                  required
                />
              </FormField>
              <FormField label="管理员邮箱 *" required>
                <input
                  type="email"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  placeholder="admin@example.com"
                  className="form-input"
                  required
                />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="登录密码 *" required>
                  <input
                    type="password"
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    placeholder="至少6位"
                    className="form-input"
                    required
                  />
                </FormField>
                <FormField label="确认密码 *" required>
                  <input
                    type="password"
                    value={regData.confirmPassword}
                    onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                    placeholder="再次输入密码"
                    className="form-input"
                    required
                  />
                </FormField>
              </div>
              <FormField label="联系人姓名">
                <input
                  type="text"
                  value={regData.contactName}
                  onChange={(e) => setRegData({ ...regData, contactName: e.target.value })}
                  placeholder="请输入联系人姓名"
                  className="form-input"
                />
              </FormField>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
              >
                {submitting ? '创建中...' : '创建管理员账号'}
              </button>
            </form>
          ) : mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <FormField label="邮箱地址 *" required>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="form-input"
                  required
                />
              </FormField>
              <FormField label="密码 *" required>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="输入您的密码"
                  className="form-input"
                  required
                />
              </FormField>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
              >
                {submitting ? '登录中...' : '登录'}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-blue-700 hover:text-blue-900 font-medium"
                >
                  还没有账号？立即注册
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <FormField label="公司/组织名称 *" required>
                <input
                  type="text"
                  value={regData.companyName}
                  onChange={(e) => setRegData({ ...regData, companyName: e.target.value })}
                  placeholder="请输入公司名称"
                  className="form-input"
                  required
                />
              </FormField>
              <FormField label="联系人姓名">
                <input
                  type="text"
                  value={regData.contactName}
                  onChange={(e) => setRegData({ ...regData, contactName: e.target.value })}
                  placeholder="请输入联系人姓名"
                  className="form-input"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="邮箱 *" required>
                  <input
                    type="email"
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="form-input"
                    required
                  />
                </FormField>
                <FormField label="联系电话">
                  <input
                    type="tel"
                    value={regData.phone}
                    onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                    placeholder="+86 ..."
                    className="form-input"
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="所在国家/地区">
                  <select
                    value={regData.country}
                    onChange={(e) => setRegData({ ...regData, country: e.target.value })}
                    className="form-input"
                  >
                    <option value="">请选择</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
                <FormField label="所属行业">
                  <select
                    value={regData.industry}
                    onChange={(e) => setRegData({ ...regData, industry: e.target.value })}
                    className="form-input"
                  >
                    <option value="">请选择</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="登录密码 *" required>
                  <input
                    type="password"
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    placeholder="至少6位"
                    className="form-input"
                    required
                  />
                </FormField>
                <FormField label="确认密码 *" required>
                  <input
                    type="password"
                    value={regData.confirmPassword}
                    onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                    placeholder="再次输入密码"
                    className="form-input"
                    required
                  />
                </FormField>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
              >
                {submitting ? '注册中...' : '注册'}
              </button>
              <p className="text-center text-sm text-stone-500">
                已有账号？{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-blue-700 hover:text-blue-900 font-medium"
                >
                  立即登录
                </button>
              </p>
            </form>
          )}

          <div className="border-t border-stone-200 pt-6">
            <p className="text-xs text-stone-400 text-center leading-relaxed">
              注册即表示同意{' '}
              <Link href="/terms" className="text-blue-700 hover:underline">《使用条款》</Link>
              {' '}和{' '}
              <Link href="/privacy" className="text-blue-700 hover:underline">《隐私政策》</Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .form-input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid #e7e5e4;
          border-radius: 0.625rem;
          font-size: 0.875rem;
          transition: all 0.2s;
          outline: none;
          background: white;
        }
        .form-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        .form-input::placeholder {
          color: #a8a29e;
        }
      `}</style>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
