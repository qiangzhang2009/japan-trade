import type { Metadata } from 'next';
import { Inter, Noto_Sans_SC } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: '出海通 AsiaBridge — 中国企业出海东南亚首选商机平台',
    template: '%s | 出海通 AsiaBridge',
  },
  description: '帮助中国企业找到东南亚、东亚优质海外客户、代理商、渠道商与合作伙伴。汇聚13国真实商机，覆盖制造业、科技、医疗、建材等全行业。',
  keywords: ['出海', '海外商机', '东南亚贸易', '代理商', '渠道商', '出海平台', 'AsiaBridge', 'China outbound', 'ASEAN trade'],
  authors: [{ name: '出海通 AsiaBridge' }],
  creator: '出海通 AsiaBridge',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    alternateLocale: 'en_US',
    siteName: '出海通 AsiaBridge',
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
    <html lang="zh-CN" className={`scroll-smooth ${inter.variable} ${notoSansSC.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased min-h-screen bg-stone-50 text-stone-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
