type LatestItem = {
  id: string
  title: string
  slug: string
  cover?: string | null
  chapter?: number
  type?: string
}

export default function LatestRelease({
  items = [],
}: {
  items?: LatestItem[]
}) {
  return (
    <section className="px-4 py-5 relative">
      {/* Subtle Blue Aurora Glow di background section */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 w-48 h-48 bg-[#42A5F5]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="mx-auto max-w-7xl relative z-10">

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#42A5F5] rounded-full"></span>
            Latest Release
          </h2>

          <a
            href="/search"
            className="text-xs sm:text-sm text-[#42A5F5] hover:underline font-medium transition-colors"
          >
            Lihat semua
          </a>
        </div>

        <div className="grid gap-3">

          {items.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gray-950/60 backdrop-blur-md p-8 text-center shadow-xl">
              <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-[#42A5F5]/10 rounded-full blur-2xl pointer-events-none"></div>
              <p className="text-sm font-medium text-gray-300">Belum ada release terbaru saat ini.</p>
              <p className="text-xs text-gray-500 mt-1">Chapter terbaru akan otomatis muncul di sini setelah tersedia.</p>
            </div>
          ) : (
            items.map(item => (
              <a
                key={item.id}
                href={`/series/${item.slug}`}
                className="group flex items-center gap-4 rounded-xl border border-white/10 bg-gray-900/60 backdrop-blur-md p-3 transition-all duration-300 hover:bg-gray-900/90 hover:border-[#42A5F5]/40 shadow-sm"
              >

                <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-950 border border-white/5 relative">
                  {item.cover ? (
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-600 text-[10px]">
                      No Cover
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-xs sm:text-sm font-semibold text-gray-200 group-hover:text-[#42A5F5] transition-colors">
                    {item.title}
                  </h3>

                  {item.type && (
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                      {item.type}
                    </p>
                  )}

                  {item.chapter !== undefined && (
                    <p className="mt-1.5 text-xs text-[#42A5F5] font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#42A5F5]"></span>
                      Chapter {item.chapter}
                    </p>
                  )}
                </div>

              </a>
            ))
          )}

        </div>

      </div>
    </section>
  )
}
