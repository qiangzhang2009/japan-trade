import Link from 'next/link';
import SiteLayout from '@/components/layout/SiteLayout';

export const metadata = {
  title: '关于我们 | 出海通 AsiaBridge',
};

export default function AboutPage() {
  return (
    <SiteLayout>
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="text-5xl mb-4">🌏</div>
          <h1 className="text-4xl font-black text-white mb-4">关于出海通 AsiaBridge</h1>
          <p className="text-lg text-blue-200 leading-relaxed">
            上海张小强企业咨询事务所 致力于帮助中国企业找到东南亚、东亚最优质的海外合作伙伴
          </p>
        </div>
      </div>

      {/* Mission */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-stone-200 p-10 mb-8">
          <h2 className="text-2xl font-black text-stone-900 mb-4">我们的使命</h2>
          <p className="text-stone-600 leading-relaxed text-lg">
            中国企业出海，最难的不是产品不够好，而是找不到对的人——
            找不到海外的代理商、渠道商和合作伙伴。信息不对称、信任建立成本高、语言沟通障碍，
            每一个都是拦路虎。
          </p>
          <p className="text-stone-600 leading-relaxed text-lg mt-4">
            <strong className="text-stone-900">出海通</strong>的使命，就是消灭这些障碍。
            我们从东南亚、东亚13个核心市场采集真实商机信息，按国家、区域、行业多维度展示，
            让您只需几分钟，就能找到目标市场的合作机会。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {[
            { num: '13', label: '覆盖国家', desc: '东南亚+东亚核心市场' },
            { num: '0', label: '新闻出版风险', desc: '只做商机不搞新闻' },
            { num: '6h', label: '数据更新频率', desc: '每6小时自动采集' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl border border-stone-200 p-6 text-center">
              <div className="text-3xl font-black text-blue-900 mb-1">{item.num}</div>
              <div className="text-sm font-semibold text-stone-700">{item.label}</div>
              <div className="text-xs text-stone-400 mt-1">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-10 mb-8">
          <h2 className="text-2xl font-black text-stone-900 mb-4">为什么选择我们</h2>
          <div className="space-y-4">
            {[
              { title: '专注商业价值', desc: '我们不生产新闻，只聚合真实商机。每一条信息都有明确的商业目的。' },
              { title: '国家+区域双重筛选', desc: '不只是按国家筛选，还能进一步细分到具体的经济圈和省份，精准锁定目标市场。' },
              { title: '合规运营', desc: '只做商机对接，不涉及新闻采集和传播，完全规避新闻出版相关法规风险。' },
              { title: '持续自动更新', desc: '数据采集系统每6小时自动运行，确保商机信息始终是最新的。' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">{item.title}</h3>
                  <p className="text-sm text-stone-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Group Network */}
        <div className="bg-white rounded-2xl border border-stone-200 p-10 mb-8">
          <h2 className="text-2xl font-black text-stone-900 mb-6">集团站点</h2>
          <p className="text-sm text-stone-500 mb-6 leading-relaxed">
            上海张小强企业咨询事务所旗下还运营以下平台，欢迎互访：
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'AfricaZero 非洲零关税',
                url: 'https://africa.zxqconsulting.com/',
                desc: '非洲零关税全链路决策平台',
                icon: '🌍',
              },
              {
                label: '张小强企业咨询',
                url: 'https://www.zxqconsulting.com/',
                desc: '本草产品出海 · 日本/澳洲/东南亚市场进入',
                icon: '🏢',
              },
              {
                label: 'Global2China 海外优品',
                url: 'https://global2china.zxqconsulting.com/',
                desc: '海外优品·中国上市 · 日本欧洲东南亚进口服务',
                icon: '🌏',
              },
            ].map(site => (
              <a
                key={site.url}
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 rounded-xl border border-stone-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <span className="text-2xl flex-shrink-0">{site.icon}</span>
                <div>
                  <p className="text-sm font-bold text-stone-800 group-hover:text-blue-800 transition-colors">{site.label}</p>
                  <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{site.desc}</p>
                </div>
                <svg className="w-4 h-4 text-stone-300 group-hover:text-blue-400 flex-shrink-0 mt-1 ml-auto transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-900 to-blue-950 rounded-2xl p-10 text-white text-center">
          <h2 className="text-2xl font-black mb-4">准备好开始了吗？</h2>
          <p className="text-blue-200 mb-6">浏览商机不需要注册，完全免费。</p>
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-bold text-blue-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-lg"
          >
            立即浏览商机
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
            &larr; 返回首页
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
