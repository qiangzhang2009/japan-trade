import SiteLayout from '@/components/layout/SiteLayout';

export const metadata = {
  title: '隐私政策 | 中日经贸通',
};

export default function Page() {
  return (
    <SiteLayout>
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-black text-stone-900 mb-4">隐私政策</h1>
        <p className="text-stone-500 mb-8">我们重视您的隐私。您的联系信息仅用于商机对接，不会被分享给第三方。</p>
        <a href="/" className="text-blue-600 hover:underline">← 返回首页</a>
      </div>
    </SiteLayout>
  );
}
