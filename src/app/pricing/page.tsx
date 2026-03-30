import Link from 'next/link';
import SiteLayout from '@/components/layout/SiteLayout';
import { mockPricingPlans } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import FAQSection from '@/components/pricing/FAQSection';

const valueProps = [
  {
    icon: '🌏',
    title: '13国市场全覆盖',
    desc: '从日本、韩国、新加坡到越南、印尼，覆盖东南亚+东亚最核心的13个出海目标市场。',
  },
  {
    icon: '🔒',
    title: '合规运营，无新闻审核风险',
    desc: '只做商机对接，不涉及新闻内容。数据全部来自公开渠道，完全规避新闻出版相关法规风险。',
  },
  {
    icon: '📊',
    title: '智能采集，数据实时更新',
    desc: '自动化数据采集系统，每6小时自动更新最新商机，无需人工维护，始终保持内容新鲜。',
  },
  {
    icon: '🤝',
    title: '精准匹配，高效对接',
    desc: '按国家、区域、行业、预算等多维度筛选，快速找到匹配的合作方，不浪费任何沟通时间。',
  },
];

function PricingCard({ plan }: { plan: typeof mockPricingPlans[0] }) {
  return (
    <div
      className={cn(
        'relative rounded-2xl p-7 flex flex-col transition-all',
        plan.highlighted
          ? 'bg-gradient-to-b from-blue-900 to-blue-950 text-white shadow-2xl shadow-blue-900/20 scale-[1.02]'
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
        <p className={cn('text-xs mt-2', plan.highlighted ? 'text-blue-300' : 'text-stone-400')}>
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
            <span className={cn('text-sm mb-1.5', plan.highlighted ? 'text-blue-300' : 'text-stone-500')}>
              /{plan.priceUnit === 'month' ? '月' : plan.priceUnit === 'year' ? '年' : '次'}
            </span>
          </div>
        )}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <svg
              className={cn('w-5 h-5 flex-shrink-0 mt-0.5', plan.highlighted ? 'text-amber-400' : 'text-emerald-500')}
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

      <Link
        href="/contact"
        className={cn(
          'w-full py-3 rounded-xl font-bold text-sm text-center transition-all',
          plan.highlighted
            ? 'bg-amber-400 text-blue-900 hover:bg-amber-300 shadow-lg'
            : 'bg-blue-900 text-white hover:bg-blue-800 shadow-sm hover:shadow-md'
        )}
      >
        {plan.cta}
      </Link>
    </div>
  );
}

export default function PricingPage() {
  return (
    <SiteLayout>
      <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-800/50 border border-blue-700/50 text-xs font-semibold text-blue-300 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            简单透明，无隐藏费用
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
            会员服务
          </h1>
          <p className="text-lg text-blue-200 leading-relaxed max-w-xl mx-auto">
            选择适合您的方案，解锁亚洲出海的全部价值
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
          {mockPricingPlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-12">
        <section>
          <h2 className="text-2xl font-black text-stone-900 mb-8 text-center">
            为什么选择出海通
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

        <section>
          <h2 className="text-2xl font-black text-stone-900 mb-2 text-center">
            常见问题
          </h2>
          <p className="text-stone-500 text-center mb-8">
            有其他问题？发送邮件至 customer@zxqconsulting.com 或致电 13764872538（联系人：张先生）
          </p>
          <FAQSection />
        </section>

        <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-2xl p-10 text-white text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-sm font-semibold mb-6">
            <span className="text-amber-400">&#9733;</span> 企业定制方案
          </div>
          <h2 className="text-3xl font-black mb-4">需要专属定制方案？</h2>
          <p className="text-blue-300 text-lg mb-8 max-w-2xl mx-auto">
            我们为大型制造企业、上市公司和咨询机构提供专属定制服务，
            包含定制国别报告、精准商机匹配和线下出海峰会对接。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="mailto:customer@zxqconsulting.com"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-blue-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-lg"
            >
              联系我们
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white border border-white/30 hover:bg-white/10 rounded-xl transition-colors"
            >
              预约电话咨询
            </Link>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
