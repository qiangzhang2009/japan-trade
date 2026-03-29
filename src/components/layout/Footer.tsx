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
      { label: '经贸资讯', href: '/news' },
      { label: '贸易数据', href: '/data' },
      { label: '商机广场', href: '/opportunities' },
      { label: '会员服务', href: '/pricing' },
    ],
  },
  data: {
    title: '数据来源',
    links: [
      { label: '日本贸易振兴机构 (JETRO)', href: 'https://www.jetro.go.jp', external: true },
      { label: '中国商务部', href: 'https://www.mofcom.gov.cn', external: true },
      { label: '日本经济产业省', href: 'https://www.meti.go.jp', external: true },
      { label: '中国海关总署', href: 'http://www.customs.gov.cn', external: true },
    ],
  },
  company: {
    title: '关于我们',
    links: [
      { label: '关于我们', href: '/about' },
      { label: '使用条款', href: '/terms' },
      { label: '隐私政策', href: '/privacy' },
      { label: '联系方式', href: '/contact' },
    ],
  },
};

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300">
      {/* Top Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">中</span>
              </div>
              <div>
                <div className="text-white font-bold">中日经贸通</div>
                <div className="text-[10px] text-stone-500">China Japan Trade Platform</div>
              </div>
            </Link>
            <p className="text-sm text-stone-400 leading-relaxed mb-6 max-w-sm">
              中日经贸信息聚合平台，为您提供实时经贸资讯、精准贸易数据、高效商机匹配，
              助您把握中日贸易新机遇。
            </p>
            <div className="flex items-center gap-4">
              <a
                href="mailto:contact@china-japan-trade.com"
                className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
              >
                contact@china-japan-trade.com
              </a>
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

      {/* Bottom Bar */}
      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-500">
            &copy; {new Date().getFullYear()} 中日经贸通. All rights reserved.
          </p>
          <p className="text-xs text-stone-600">
            数据来源均为公开信息，仅供参考，不构成投资建议。
          </p>
        </div>
      </div>
    </footer>
  );
}
