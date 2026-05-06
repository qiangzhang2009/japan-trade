import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-8xl font-black text-stone-200 select-none">404</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-stone-900">页面未找到</h1>
          <p className="text-stone-500">
            您访问的页面不存在或已被移除。
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-800 hover:bg-blue-900 rounded-xl transition-colors shadow-md"
          >
            返回首页
          </Link>
          <Link
            href="/opportunities"
            className="px-6 py-2.5 text-sm font-medium text-stone-600 border border-stone-300 hover:bg-stone-100 rounded-xl transition-colors"
          >
            浏览商机
          </Link>
        </div>
      </div>
    </div>
  );
}
