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
    <section className="px-4 py-5">
      <div className="mx-auto max-w-7xl">

        <h2 className="mb-4 text-lg font-bold">
          Trending
        </h2>

        {items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-gray-500">
            Belum ada data trending.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">

            {items.map((item, index) => (
              <a
                key={item.id}
                href={`/series/${item.slug}`}
                className="group"
              >
                <div className="relative aspect-video overflow-hidden rounded-xl bg-white/5">

                  {item.cover && (
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  )}

                  <span className="absolute left-2 top-2 rounded-lg bg-black/70 px-2 py-1 text-xs font-bold text-[#42A5F5]">
                    #{index + 1}
                  </span>

                </div>

                <p className="mt-2 line-clamp-2 text-sm font-semibold">
                  {item.title}
                </p>

                {item.type && (
                  <p className="mt-1 text-[10px] text-gray-500">
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
