import SiteLayout from '@/components/layout/SiteLayout';

export const metadata = {
  title: '联系我们 | 中日经贸通',
};

export default function Page() {
  return (
    <SiteLayout>
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-black text-stone-900 mb-4">联系我们</h1>
        <p className="text-stone-500 mb-8">如有合作或服务咨询，欢迎通过邮件联系我们。</p>
        <p className="text-lg text-stone-700 mb-8">邮箱: <a href="mailto:contact@china-japan-trade.com" className="text-blue-600 hover:underline">contact@china-japan-trade.com</a></p>
        <a href="/" className="text-blue-600 hover:underline">← 返回首页</a>
      </div>
    </SiteLayout>
  );
}
