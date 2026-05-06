export default function HomeLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="w-72 h-6 bg-blue-800/40 rounded-full animate-pulse mb-6" />
            <div className="w-full h-16 bg-blue-800/30 rounded-xl animate-pulse mb-4" />
            <div className="w-2/3 h-10 bg-blue-800/20 rounded-xl animate-pulse mb-6" />
            <div className="w-full h-6 bg-blue-800/20 rounded animate-pulse mb-8 max-w-2xl" />
            <div className="flex gap-3">
              <div className="w-44 h-12 bg-amber-400/80 rounded-xl animate-pulse" />
              <div className="w-36 h-12 bg-white/10 rounded-xl animate-pulse" />
            </div>
            <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-white/10">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="w-16 h-8 bg-blue-800/40 rounded animate-pulse mb-1" />
                  <div className="w-20 h-3 bg-blue-800/20 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Country grid skeleton */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-48 h-8 bg-stone-200 rounded animate-pulse mb-10" />
        {[1, 2, 3].map((tier) => (
          <div key={tier} className="mb-8">
            <div className="w-64 h-5 bg-stone-200 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: tier === 3 ? 5 : 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border-2 border-stone-200 p-5 h-52 animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Featured opps skeleton */}
      <section className="py-16 bg-white border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-40 h-8 bg-stone-200 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border p-4 h-44 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
