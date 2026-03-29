import Link from 'next/link';
import SiteLayout from '@/components/layout/SiteLayout';
import AdBanner from '@/components/ads/AdBanner';
import { mockPricingPlans } from '@/lib/mockData';
import { cn } from '@/lib/utils';

const faqs = [
  {
    q: '免费版和专业版有什么区别？',
    a: '免费版每天提供5条精选商机，可浏览公开经贸资讯和基础贸易数据。专业版无限浏览所有商机、访问贸易数据API、获取每周商机快讯推送，并享受优先展示权益。',
  },
  {
    q: '如何升级到专业版或企业版？',
    a: '点击「立即升级」按钮，选择适合您的方案，通过支付宝、微信或信用卡完成支付。支付成功后，会员权益即时生效。',
  },
  {
    q: '订阅是否可以取消或退款？',
    a: '您可以随时取消订阅，取消后您的会员权益将持续到当期订阅结束。我们提供7天无理由退款保障。',
  },
  {
    q: '企业版的数据API有哪些接口？',
    a: '企业版用户可访问中日海关进出口数据API、商机搜索API、企业信息查询API，支持RESTful接口和Webhook实时推送。',
  },
  {
    q: '商机匹配服务是如何运作的？',
    a: '企业版用户提交合作需求后，我们的AI系统根据行业、地区、预算等维度，自动匹配合适的商机并安排对接，节省您80%以上的筛选时间。',
  },
];

const valueProps = [
  {
    icon: '⚡',
    title: '自动化更新，零维护运营',
    desc: '所有资讯、商机和数据均通过AI自动采集更新，无需人工干预，每月运营时间<5小时。',
  },
  {
    icon: '🔒',
    title: '数据安全，合规运营',
    desc: '严格遵守中日两国数据保护法规，所有采集数据均来自公开渠道，保障您的商业信息安全。',
  },
  {
    icon: '🌏',
    title: '中日双语，无障碍沟通',
    desc: '全站支持中日双语展示，自动翻译功能帮助您跨越语言障碍，快速对接优质合作伙伴。',
  },
  {
    icon: '📊',
    title: '数据驱动，精准决策',
    desc: '基于海关真实进出口数据，为您提供可信赖的市场分析和趋势预判，辅助商业决策。',
  },
];

function PricingCard({ plan }: { plan: typeof mockPricingPlans[0] }) {
  return (
    <div
      className={cn(
        'relative rounded-2xl p-7 flex flex-col transition-all',
        plan.highlighted
          ? 'bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-2xl shadow-blue-200 scale-[1.02]'
          : 'bg-white border border-stone-200 hover:border-blue-200 hover:shadow-lg'
      )}
    >
      {plan.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-lg">
            {plan.badge}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className={cn('text-lg font-black mb-1', plan.highlighted ? 'text-white' : 'text-stone-900')}>
          {plan.name}
        </h3>
        <p className={cn('text-sm', plan.highlighted ? 'text-blue-200' : 'text-stone-500')}>
          {plan.nameJp}
        </p>
        <p className={cn('text-xs mt-2', plan.highlighted ? 'text-blue-200' : 'text-stone-400')}>
          {plan.tagline}
        </p>
      </div>

      <div className="mb-6">
        {plan.price === 0 ? (
          <div className={cn('text-4xl font-black', plan.highlighted ? 'text-white' : 'text-stone-900')}>
            免费
          </div>
        ) : (
          <div className="flex items-end gap-1">
            <span className={cn('text-4xl font-black', plan.highlighted ? 'text-white' : 'text-stone-900')}>
              ¥{plan.price}
            </span>
            <span className={cn('text-sm mb-1.5', plan.highlighted ? 'text-blue-200' : 'text-stone-500')}>
              /{plan.priceUnit === 'month' ? '月' : plan.priceUnit === 'year' ? '年' : '次'}
            </span>
          </div>
        )}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <svg
              className={cn('w-5 h-5 flex-shrink-0 mt-0.5', plan.highlighted ? 'text-blue-200' : 'text-emerald-500')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className={cn('text-sm', plan.highlighted ? 'text-blue-100' : 'text-stone-600')}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <button
        className={cn(
          'w-full py-3 rounded-xl font-bold text-sm transition-all',
          plan.highlighted
            ? 'bg-white text-blue-600 hover:bg-blue-50 shadow-lg'
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
        )}
      >
        {plan.cta}
      </button>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-stone-100 last:border-0">
      <button className="w-full flex items-center justify-between py-5 text-left">
        <span className="font-semibold text-stone-900 pr-8">{q}</span>
        <svg className="w-5 h-5 text-stone-400 flex-shrink-0 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <p className="text-sm text-stone-500 leading-relaxed pb-5">{a}</p>
    </div>
  );
}

export default function PricingPage() {
  return (
    <SiteLayout>
      {/* Page Header */}
      <div className="hero-gradient py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-stone-900 mb-4">
            会员服务
          </h1>
          <p className="text-lg text-stone-600 leading-relaxed">
            选择适合您的方案，解锁中日贸易的全部价值
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
          {mockPricingPlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-12">
        {/* Value Props */}
        <section>
          <h2 className="text-2xl font-black text-stone-900 mb-8 text-center">
            为什么选择中日经贸通
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {valueProps.map((prop) => (
              <div
                key={prop.title}
                className="bg-white rounded-xl border border-stone-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="text-3xl mb-3">{prop.icon}</div>
                <h3 className="font-bold text-stone-900 mb-2">{prop.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{prop.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <AdBanner />

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-black text-stone-900 mb-2 text-center">
            常见问题
          </h2>
          <p className="text-stone-500 text-center mb-8">有其他问题？发送邮件至 contact@china-japan-trade.com</p>
          <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 px-5">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>

        {/* Enterprise CTA */}
        <section className="bg-gradient-to-br from-stone-900 via-stone-800 to-blue-900 rounded-2xl p-10 text-white text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-semibold mb-6">
            <span className="text-amber-400">★</span> 企业定制方案
          </div>
          <h2 className="text-3xl font-black mb-4">需要专属定制方案？</h2>
          <p className="text-stone-300 text-lg mb-8 max-w-2xl mx-auto">
            我们为大型企业、贸易集团和投资机构提供专属定制服务，包含私有数据API、
            专属客户经理和线下对接活动。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="mailto:enterprise@china-japan-trade.com"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-stone-900 bg-white hover:bg-blue-50 rounded-xl transition-colors"
            >
              联系我们
            </Link>
            <button className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white border border-white/30 hover:bg-white/10 rounded-xl transition-colors">
              预约电话咨询
            </button>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
