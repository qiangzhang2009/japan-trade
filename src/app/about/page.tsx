import SiteLayout from '@/components/layout/SiteLayout';

export const metadata = {
  title: '关于我们 | 中日经贸通',
};

export default function Page() {
  return (
    <SiteLayout>
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-black text-stone-900 mb-4">关于中日经贸通</h1>
        <p className="text-stone-500 mb-8">中日经贸通是专注中日双边贸易的一站式信息聚合平台，为中国企业和投资者提供日本经贸资讯、商机匹配和贸易数据服务。</p>
        <a href="/" className="text-blue-600 hover:underline">← 返回首页</a>
      </div>
    </SiteLayout>
  );
}
