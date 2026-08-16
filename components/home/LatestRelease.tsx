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
    <section className="px-4 py-5">
      <div className="mx-auto max-w-7xl">

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            Latest Release
          </h2>

          <a
            href="/search"
            className="text-xs text-[#42A5F5]"
          >
            Lihat semua
          </a>
        </div>

        <div className="grid gap-3">

          {items.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-gray-500">
              Belum ada release.
            </div>
          ) : (
            items.map(item => (
              <a
                key={item.id}
                href={`/series/${item.slug}`}
                className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]"
              >

                <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-white/5">
                  {item.cover && (
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-sm font-semibold">
                    {item.title}
                  </h3>

                  {item.type && (
                    <p className="mt-1 text-[10px] text-gray-500">
                      {item.type}
                    </p>
                  )}

                  {item.chapter !== undefined && (
                    <p className="mt-2 text-xs text-[#42A5F5]">
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
