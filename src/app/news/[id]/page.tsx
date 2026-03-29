import Link from 'next/link';
import SiteLayout from '@/components/layout/SiteLayout';
import AdBanner from '@/components/ads/AdBanner';
import { mockNews } from '@/lib/mockData';
import { formatDate, getCategoryLabel } from '@/lib/utils';

export default async function NewsDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const article = mockNews.find((n) => n.id === params.id);

  if (!article) {
    return (
      <SiteLayout>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">文章未找到</h1>
          <p className="text-stone-500 mb-8">您访问的文章不存在或已被移除</p>
          <Link href="/news" className="text-blue-600 hover:underline">
            返回资讯列表
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-stone-400 mb-8">
          <Link href="/" className="hover:text-blue-600 transition-colors">首页</Link>
          <span>/</span>
          <Link href="/news" className="hover:text-blue-600 transition-colors">经贸资讯</Link>
          <span>/</span>
          <span className="text-stone-600 truncate max-w-xs">{article.title.slice(0, 20)}...</span>
        </nav>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              {getCategoryLabel(article.category)}
            </span>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
              article.country === 'bilateral' ? 'bg-purple-50 text-purple-600 border-purple-100' :
              article.country === 'cn' ? 'bg-red-50 text-red-600 border-red-100' :
              'bg-blue-50 text-blue-600 border-blue-100'
            }`}>
              {article.country === 'bilateral' ? '中日双边' : article.country === 'cn' ? '中国' : '日本'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 leading-tight mb-6">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500 pb-6 border-b border-stone-200">
            <span className="font-medium">{article.source}</span>
            <span>·</span>
            <time>{formatDate(article.publishedAt, 'zh')}</time>
            <div className="flex flex-wrap gap-1.5 ml-auto">
              {article.tags.map((tag) => (
                <span key={tag} className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* Featured Image Placeholder */}
        <div className="bg-gradient-to-br from-blue-100 via-purple-50 to-amber-50 rounded-2xl h-64 sm:h-80 flex items-center justify-center mb-8">
          <div className="text-center">
            <div className="text-7xl font-black text-blue-200 mb-2">{getCategoryLabel(article.category)[0]}</div>
            <p className="text-sm text-stone-400">{article.source}</p>
          </div>
        </div>

        {/* Article Body */}
        <div className="prose prose-stone max-w-none mb-12">
          <p className="text-lg text-stone-700 leading-relaxed font-medium mb-6">
            {article.summary}
          </p>
          <p className="text-base text-stone-600 leading-relaxed">
            本资讯来源于{article.source}，由中日经贸通自动采集并整理。如需了解更多详细信息，
            请访问<a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {article.source}
            </a>官方网站获取最新内容。
          </p>
          <div className="mt-8 p-6 bg-stone-50 rounded-xl border border-stone-200">
            <h3 className="font-bold text-stone-800 mb-3">数据来源</h3>
            <ul className="space-y-2 text-sm text-stone-600">
              <li>• 日本贸易振兴机构 (JETRO) — {article.country === 'jp' || article.country === 'bilateral' ? '包含' : '参考'}</li>
              <li>• 中国商务部 — {article.country === 'cn' || article.country === 'bilateral' ? '包含' : '参考'}</li>
              <li>• {article.source} — 原始发布平台</li>
            </ul>
          </div>
        </div>

        {/* Source Link */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 flex items-center justify-between mb-8">
          <div>
            <p className="text-sm font-semibold text-stone-800">阅读原文</p>
            <p className="text-xs text-stone-400 mt-0.5">{article.source}</p>
          </div>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            前往原文
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        <AdBanner />
      </article>
    </SiteLayout>
  );
}
