import SiteLayout from '@/components/layout/SiteLayout';

export const metadata = {
  title: '使用条款 | 中日经贸通',
};

export default function Page() {
  return (
    <SiteLayout>
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-black text-stone-900 mb-4">使用条款</h1>
        <p className="text-stone-500 mb-8">使用本网站即表示您同意我们的服务条款。所有信息仅供参考，不构成投资建议。</p>
        <a href="/" className="text-blue-600 hover:underline">← 返回首页</a>
      </div>
    </SiteLayout>
  );
}
