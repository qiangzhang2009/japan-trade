'use client';

export default function OpportunitiesLoading() {
  return (
    <>
      {/* Stats bar skeleton */}
      <div className="bg-stone-800 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-16 h-5 bg-stone-700 rounded animate-pulse" />
                <div className="w-8 h-5 bg-stone-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Page header skeleton */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="w-48 h-9 bg-stone-200 rounded-lg animate-pulse mb-2" />
              <div className="w-96 h-5 bg-stone-100 rounded animate-pulse" />
            </div>
            <div className="w-full lg:w-96 h-11 bg-stone-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar skeleton */}
          <aside className="w-52 flex-shrink-0 hidden lg:block">
            <div className="sticky top-20 bg-white rounded-xl border border-stone-200 p-4">
              <div className="w-24 h-4 bg-stone-200 rounded animate-pulse mb-4" />
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="w-full h-8 bg-stone-100 rounded-lg animate-pulse mb-1" />
              ))}
            </div>
          </aside>

          {/* Main content skeleton */}
          <div className="flex-1 min-w-0">
            {/* Filter bar skeleton */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-24 h-8 bg-stone-100 rounded-lg animate-pulse" />
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between pt-3 border-t border-stone-100">
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-16 h-6 bg-stone-100 rounded-full animate-pulse" />
                  ))}
                </div>
                <div className="w-32 h-8 bg-stone-100 rounded-lg animate-pulse" />
              </div>
            </div>

            {/* Results count skeleton */}
            <div className="w-32 h-5 bg-stone-200 rounded animate-pulse mb-4" />

            {/* Card grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-1.5">
                      <div className="w-20 h-6 bg-stone-100 rounded-full animate-pulse" />
                      <div className="w-16 h-6 bg-stone-100 rounded-full animate-pulse" />
                    </div>
                    <div className="w-8 h-8 bg-stone-100 rounded animate-pulse" />
                  </div>
                  <div className="w-3/4 h-5 bg-stone-100 rounded animate-pulse mb-2" />
                  <div className="w-full h-4 bg-stone-100 rounded animate-pulse mb-1" />
                  <div className="w-2/3 h-4 bg-stone-100 rounded animate-pulse mb-3" />
                  <div className="flex gap-2 mb-2">
                    <div className="w-16 h-5 bg-stone-100 rounded animate-pulse" />
                    <div className="w-20 h-5 bg-stone-100 rounded animate-pulse" />
                  </div>
                  <div className="pt-3 border-t border-stone-100 flex justify-between">
                    <div className="w-24 h-4 bg-stone-100 rounded animate-pulse" />
                    <div className="w-16 h-4 bg-stone-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
