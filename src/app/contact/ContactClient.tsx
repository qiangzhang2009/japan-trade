'use client';

import { useState } from 'react';
import SiteLayout from '@/components/layout/SiteLayout';
import { cn } from '@/lib/utils';

const INQUIRY_TYPES = [
  { value: 'general', label: '一般咨询' },
  { value: 'membership', label: '会员服务' },
  { value: 'business', label: '商务合作' },
  { value: 'enterprise', label: '企业定制' },
  { value: 'feedback', label: '意见反馈' },
];

const RESPONSE_TIMES: Record<string, string> = {
  general: '1-2 个工作日',
  membership: '24 小时内',
  business: '1 个工作日',
  enterprise: '2-4 小时',
  feedback: '3-5 个工作日',
};

export default function ContactClient() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inquiryType, setInquiryType] = useState('general');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(form: HTMLFormElement) {
    const errs: Record<string, string> = {};
    const fd = new FormData(form);
    if (!fd.get('name')?.toString().trim()) errs.name = '请填写姓名';
    const email = fd.get('email')?.toString().trim() || '';
    if (!email) errs.email = '请填写邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = '邮箱格式不正确';
    if (!fd.get('message')?.toString().trim()) errs.message = '请填写留言内容';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <SiteLayout>
        <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-stone-900 mb-3">消息已发送</h1>
            <p className="text-stone-500 mb-2">
              我们将在 <strong className="text-stone-700">{RESPONSE_TIMES[inquiryType]}</strong> 内回复您。
            </p>
            <p className="text-stone-400 text-sm mb-8">
              同时您也可以直接发送邮件至{' '}
              <a href="mailto:customer@zxqconsulting.com" className="text-blue-600 hover:underline">
                customer@zxqconsulting.com
              </a>
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2.5 text-sm font-medium text-stone-600 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
            >
              发送另一条消息
            </button>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-800/50 border border-blue-700/50 text-xs font-semibold text-blue-300 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            通常 {RESPONSE_TIMES[inquiryType]} 内回复
          </div>
          <h1 className="text-4xl font-black text-white mb-3">联系我们</h1>
          <p className="text-blue-200 text-lg">
            有任何问题或合作意向，欢迎填写表单或直接发送邮件
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
              <h2 className="text-xl font-black text-stone-900 mb-6 flex items-center gap-2">
                <span>✉️</span> 发送消息
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                      姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="name"
                      type="text"
                      placeholder="您的姓名"
                      className={cn(
                        'w-full px-4 py-2.5 text-sm border rounded-xl bg-stone-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors',
                        errors.name ? 'border-red-300 bg-red-50' : 'border-stone-200'
                      )}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                      公司名称
                    </label>
                    <input
                      name="company"
                      type="text"
                      placeholder="您的公司（选填）"
                      className="w-full px-4 py-2.5 text-sm border border-stone-200 rounded-xl bg-stone-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                    邮箱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="business@example.com"
                    className={cn(
                      'w-full px-4 py-2.5 text-sm border rounded-xl bg-stone-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors',
                      errors.email ? 'border-red-300 bg-red-50' : 'border-stone-200'
                    )}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                    咨询类型
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {INQUIRY_TYPES.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setInquiryType(t.value)}
                        className={cn(
                          'px-3 py-2 text-xs font-medium rounded-xl border transition-all text-center',
                          inquiryType === t.value
                            ? 'bg-blue-800 text-white border-blue-800 shadow-sm'
                            : 'bg-white text-stone-600 border-stone-200 hover:border-blue-300 hover:bg-blue-50'
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                    留言内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    rows={5}
                    placeholder="请详细描述您的问题或合作意向，我们会认真对待每一条消息..."
                    className={cn(
                      'w-full px-4 py-3 text-sm border rounded-xl bg-stone-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors resize-none',
                      errors.message ? 'border-red-300 bg-red-50' : 'border-stone-200'
                    )}
                  />
                  {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 text-sm font-bold text-white bg-blue-800 hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      发送中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      发送消息
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Direct Email */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">直接邮件</h3>
              <div className="space-y-3">
                {[
                  { label: '商务/会员咨询', email: 'customer@zxqconsulting.com' },
                ].map(item => (
                  <a
                    key={item.label}
                    href={`mailto:${item.email}`}
                    className="flex items-start gap-3 group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-blue-100 transition-colors">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-stone-400">{item.label}</p>
                      <p className="text-sm font-medium text-blue-600 group-hover:underline">{item.email}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Direct Phone */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">联系电话</h3>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-stone-400">联系人</p>
                  <p className="text-sm font-semibold text-stone-800">张先生</p>
                  <p className="text-sm font-medium text-blue-600">13764872538</p>
                </div>
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
              <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                响应时间
              </h3>
              <div className="space-y-2">
                {INQUIRY_TYPES.map(t => (
                  <div key={t.value} className="flex items-center justify-between">
                    <span className="text-xs text-blue-700">{t.label}</span>
                    <span className={cn(
                      'text-[10px] font-mono px-2 py-0.5 rounded-full',
                      inquiryType === t.value
                        ? 'bg-blue-800 text-white'
                        : 'bg-blue-100 text-blue-600'
                    )}>
                      {RESPONSE_TIMES[t.value]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ hint */}
            <div className="bg-stone-50 rounded-2xl border border-stone-200 p-6">
              <h3 className="text-sm font-bold text-stone-700 mb-3">常见问题</h3>
              <p className="text-xs text-stone-500 mb-3 leading-relaxed">
                在联系我们之前，您或许可以在常见问题中找到答案：
              </p>
              <div className="space-y-2">
                {[
                  ['会员订阅与退款', '/pricing'],
                  ['如何发布商机', '/opportunities'],
                  ['数据来源说明', '/about'],
                ].map(([label, href]) => (
                  <a
                    key={label}
                    href={href}
                    className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {label}
                  </a>
                ))}
              </div>
            </div>

            {/* Social */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4">关注我们</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-1.5 text-lg">
                    💬
                  </div>
                  <p className="text-[10px] text-stone-500">微信公众号</p>
                  <p className="text-[11px] text-blue-700 font-semibold">张小强出海</p>
                </div>
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-1.5 text-lg">
                    📺
                  </div>
                  <p className="text-[10px] text-stone-500">视频号</p>
                  <p className="text-[11px] text-blue-700 font-semibold">张小强出海</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
