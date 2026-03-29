import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '中日经贸通 - China Japan Trade',
    template: '%s | 中日经贸通',
  },
  description: '中日经贸信息聚合平台 - 实时推送中日内贸商机、政策动态、贸易数据，助您把握中日贸易新机遇',
  keywords: ['中日贸易', '中日经贸', '中国日本', '商机', '贸易数据', 'JETRO', '商务部'],
  authors: [{ name: '中日经贸通' }],
  creator: '中日经贸通',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    alternateLocale: 'ja_JP',
    siteName: '中日经贸通',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased min-h-screen bg-neutral-warm text-neutral-dark">
        {children}
      </body>
    </html>
  );
}
