type TrendingItem = {
  id: string
  title: string
  slug: string
  cover?: string | null
  type?: string
}

export default function Trending({
  items = [],
}: {
  items?: TrendingItem[]
}) {
  return (
    <section className="px-4 py-5 relative">
      {/* Subtle Blue Aurora Glow di background section */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 w-48 h-48 bg-[#42A5F5]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="mx-auto max-w-7xl relative z-10">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#42A5F5] rounded-full"></span>
            Trending
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gray-950/60 backdrop-blur-md p-8 text-center shadow-xl">
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#42A5F5]/10 rounded-full blur-2xl pointer-events-none"></div>
            <p className="text-sm font-medium text-gray-300">Belum ada data trending saat ini.</p>
            <p className="text-xs text-gray-500 mt-1">Daftar series populer akan otomatis muncul di sini setelah tersedia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">

            {items.map((item, index) => (
              <a
                key={item.id}
                href={`/series/${item.slug}`}
                className="group block"
              >
                <div className="relative aspect-[3/4] sm:aspect-video overflow-hidden rounded-xl border border-white/10 bg-gray-900/80 shadow-md transition-all duration-300 group-hover:border-[#42A5F5]/40">

                  {item.cover ? (
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-950 text-gray-600 text-xs">
                      No Cover
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                  <span className="absolute left-2 top-2 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 px-2.5 py-1 text-xs font-bold text-[#42A5F5] shadow-sm">
                    #{index + 1}
                  </span>

                </div>

                <p className="mt-2.5 line-clamp-2 text-xs sm:text-sm font-semibold text-gray-200 group-hover:text-[#42A5F5] transition-colors">
                  {item.title}
                </p>

                {item.type && (
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                    {item.type}
                  </p>
                )}
              </a>
            ))}

          </div>
        )}

      </div>
    </section>
  )
}
