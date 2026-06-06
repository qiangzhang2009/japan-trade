import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '出海通 AsiaBridge — 中国企业出海亚洲一站式服务平台',
  description: '汇聚东南亚+东亚优质商机，精准对接海外代理商、渠道商与合作伙伴。覆盖日本、韩国、新加坡、越南、马来西亚等16个亚洲市场。',
  keywords: '中国企业出海, 海外商机, 代理商对接, 亚洲市场, 中医药出海, 日本市场, 韩国市场',
  icons: { icon: '/favicon.svg', },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#0a0a0f] text-[#f0f0f8] antialiased">
        {children}
      </body>
    </html>
  );
}
