'use client'

type ContinueItem = {
  id: string
  title: string
  cover?: string | null
  chapter?: number
  slug: string
}

export default function ContinueReading({
  items = [],
}: {
  items?: ContinueItem[]
}) {
  if (items.length === 0) return null

  return (
    <section className="px-4 py-5">
      <div className="mx-auto max-w-7xl">

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            Continue Reading
          </h2>

          <a
            href="/history"
            className="text-xs text-[#42A5F5]"
          >
            Lihat semua
          </a>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">

          {items.map(item => (
            <a
              key={item.id}
              href={`/reader/${item.slug}/${item.id}`}
              className="w-32 shrink-0"
            >
              <div className="aspect-[2/3] overflow-hidden rounded-xl bg-white/5">
                {item.cover ? (
                  <img
                    src={item.cover}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-gray-500">
                    NO COVER
                  </div>
                )}
              </div>

              <p className="mt-2 line-clamp-2 text-xs font-medium">
                {item.title}
              </p>

              {item.chapter !== undefined && (
                <p className="mt-1 text-[10px] text-gray-500">
                  Chapter {item.chapter}
                </p>
              )}
            </a>
          ))}

        </div>

      </div>
    </section>
  )
}
