'use client'

import { useEffect, useState } from 'react'

type BannerItem = {
  id: string
  title: string
  image: string
  link?: string | null
}

const defaultBanners: BannerItem[] = [
  {
    id: 'default-1',
    title: 'Ellaria',
    image: '/banner-placeholder.jpg',
    link: '/search',
  },
]

export default function Banner({
  items = defaultBanners,
}: {
  items?: BannerItem[]
}) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (items.length <= 1) return

    const timer = setInterval(() => {
      setActive(current =>
        current >= items.length - 1
          ? 0
          : current + 1
      )
    }, 3000)

    return () => clearInterval(timer)
  }, [items.length])

  const banner = items[active]

  return (
    <section className="px-4 py-4">
      <div className="mx-auto max-w-7xl">

        <a
          href={banner.link || '#'}
          className="group block overflow-hidden rounded-2xl border border-white/10 bg-[#0b1016]"
        >
          <div className="relative aspect-video overflow-hidden md:aspect-[3/1]">

            <img
              src={banner.image}
              alt={banner.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            <div className="absolute bottom-0 left-0 p-5">
              <h1 className="text-xl font-bold md:text-3xl">
                {banner.title}
              </h1>
            </div>

          </div>
        </a>

        {items.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setActive(index)}
                aria-label={`Banner ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === active
                    ? 'w-7 bg-[#42A5F5]'
                    : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  )
}
