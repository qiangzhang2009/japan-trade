import Link from 'next/link';

const footerLinks: {
  [key: string]: {
    title: string;
    links: Array<{ label: string; href: string; external?: boolean }>;
  };
} = {
  product: {
    title: '产品服务',
    links: [
      { label: '商机广场', href: '/opportunities' },
      { label: '行业版块', href: '/industries' },
      { label: '会员服务', href: '/pricing' },
    ],
  },
    markets: {
    title: '目标市场',
    links: [
      { label: '日本', href: '/countries/japan' },
      { label: '韩国', href: '/countries/south-korea' },
      { label: '新加坡', href: '/countries/singapore' },
      { label: '越南', href: '/countries/vietnam' },
      { label: '印尼', href: '/countries/indonesia' },
      { label: '马来西亚', href: '/countries/malaysia' },
    ],
  },
  company: {
    title: '关于我们',
    links: [
      { label: '关于我们', href: '/about' },
      { label: '使用条款', href: '/terms' },
      { label: '隐私政策', href: '/privacy' },
      { label: '联系方式', href: '/contact' },
      { label: '登录账号', href: '/login' },
    ],
  },
  network: {
    title: '集团站点',
    links: [
      { label: 'AfricaZero 非洲零关税', href: 'https://africa.zxqconsulting.com/', external: true },
      { label: '上海张小强企业咨询', href: 'https://www.zxqconsulting.com/', external: true },
      { label: 'Global2China 海外优品', href: 'https://global2china.zxqconsulting.com/', external: true },
    ],
  },
};

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-900 to-blue-950 flex items-center justify-center">
                <span className="text-white font-black text-sm">出</span>
              </div>
              <div>
                <div className="text-white font-black text-base leading-none">出海通</div>
                <div className="text-[10px] text-stone-500 leading-none mt-0.5">AsiaBridge</div>
              </div>
            </Link>
            <p className="text-sm text-stone-400 leading-relaxed mb-6 max-w-sm">
              帮助中国企业找到东南亚、东亚优质海外客户、代理商、渠道商与合作伙伴。
              汇聚13国真实商机，解决出海信息不对称的核心痛点。
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="mailto:customer@zxqconsulting.com"
                className="text-sm text-blue-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                customer@zxqconsulting.com
              </a>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-sm text-blue-400">联系人：张先生 13764872538</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm text-blue-400">微信公众号/视频号：<strong className="text-white font-semibold">张小强出海</strong></span>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-stone-400 hover:text-white transition-colors flex items-center gap-1"
                      >
                        {link.label}
                        <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-stone-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-500">
            &copy; {new Date().getFullYear()} 出海通 AsiaBridge. All rights reserved.
          </p>
          <p className="text-xs text-stone-600">
            合规运营 · 仅做商机对接，不涉及新闻内容 · 数据来自公开渠道
          </p>
        </div>
      </div>
    </footer>
  );
}
