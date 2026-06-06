'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Send, CheckCircle, Clock, MessageSquare } from 'lucide-react';

const SERVICES = [
  '日本市场进入', '韩国市场进入', '东南亚市场进入',
  '海外渠道对接', '合规认证咨询', 'ODM/OEM合作对接',
  '市场调研报告', '其他咨询',
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    service: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#0a0a0f] pt-20 flex items-center justify-center">
          <div className="max-w-md mx-auto px-4 text-center py-20">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-4">咨询已提交</h1>
            <p className="text-gray-400 mb-2">
              感谢您的咨询，我们的顾问将在
            </p>
            <p className="text-brand-400 font-semibold mb-6">24小时内</p>
            <p className="text-gray-500 text-sm mb-8">
              主动通过您留下的联系方式与您取得联系，<br />
              初步分析您的需求并提供免费市场评估。
            </p>
            <a href="/" className="text-brand-400 hover:text-brand-300 font-medium">
              返回首页
            </a>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#0a0a0f] pt-20">
        {/* Header */}
        <div className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-950 to-[#0a0a0f]" />
          <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-8 h-8 text-brand-400" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">免费咨询</h1>
            <p className="text-gray-400 text-lg">告诉我们您的需求，15分钟内给出初步市场评估</p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-3xl mx-auto px-4 pb-20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1 */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  姓名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="您的姓名"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  公司名称 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="您的公司名称"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  联系电话
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="手机号码（可选）"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  电子邮箱 <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Service */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                需要的服务 <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, service: form.service === s ? '' : s })}
                    className={`px-4 py-2 rounded-xl text-sm border transition-all ${
                      form.service === s
                        ? 'bg-brand-600 border-brand-500 text-white'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-brand-500/50 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                您的需求描述 <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="请描述您的产品类型、目标市场、出海阶段，以及您目前遇到的具体问题或挑战。我们会根据您的实际情况给出针对性的建议。"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500/50 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold text-lg hover:from-brand-500 hover:to-brand-600 transition-all shadow-2xl shadow-brand-700/40"
              >
                <Send className="w-5 h-5" />
                提交咨询
              </button>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <Clock className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-600 leading-relaxed">
                我们重视您的隐私，您提交的信息仅用于顾问评估和联系用途，绝不向第三方披露。
                通常在24小时内回复，紧急需求可发邮件至 partner@asiabridge.cn。
              </p>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
