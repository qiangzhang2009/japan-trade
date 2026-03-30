'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    q: '免费版和专业版有什么区别？',
    a: '免费版可浏览全部商机信息、查看13国市场概览。专业版解锁无限联系商机发布方、优先展示给海外合作伙伴、专属出海顾问咨询等核心权益。',
  },
  {
    q: '商机对接服务是如何运作的？',
    a: '专业版用户可以直接联系商机发布方，获取详细合作信息。企业版用户额外享受B2B精准商机匹配服务，由专属顾问协助对接。',
  },
  {
    q: '订阅是否可以取消或退款？',
    a: '您可以随时取消订阅，取消后会员权益将持续到当期订阅结束。我们提供7天无理由退款保障。',
  },
  {
    q: '数据来源是什么？',
    a: '我们从各国政府贸易门户、半官方贸易促进机构（如JETRO、KOTRA）和权威媒体RSS采集商机信息，所有数据均来自公开渠道。',
  },
  {
    q: '商机信息的真实性如何保证？',
    a: '所有提交到平台的商机均经过审核团队验证。企业版用户可获得额外的企业背景调查支持。',
  },
  {
    q: '企业定制方案包含哪些服务？',
    a: '企业定制方案包含：定制国别市场研究报告（每月1份）、B2B精准商机匹配（不限次数）、全年不限次出海顾问咨询、企业品牌专属展示位、线下出海峰会优先报名资格，以及竞品动态监控预警服务。',
  },
  {
    q: '如何联系商机发布方？',
    a: '专业版及以上用户可直接在商机详情页申请对接合作。我们会将您的意向转达给发布方，并在24小时内安排对接。企业版用户还可享受专属顾问全程跟进服务。',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-stone-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left hover:bg-stone-50 transition-colors -mx-2 px-2 rounded-lg"
      >
        <span className={cn(
          'font-semibold pr-8 transition-colors',
          open ? 'text-blue-800' : 'text-stone-900'
        )}>
          {q}
        </span>
        <svg
          className={cn(
            'w-5 h-5 text-stone-400 flex-shrink-0 transition-all duration-300',
            open && 'rotate-180 text-blue-600'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <p className="text-sm text-stone-500 leading-relaxed pb-5 pl-2">
          {a}
        </p>
      </div>
    </div>
  );
}

export default function FAQSection() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 px-5">
      {faqs.map((faq) => (
        <FAQItem key={faq.q} q={faq.q} a={faq.a} />
      ))}
    </div>
  );
}
