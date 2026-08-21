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
    title: 'Ellaria - Platform Baca Manga & Novel',
    image: '',
    link: '/search',
  },
]

export default function Banner({
  items = defaultBanners,
}: {
  items?: BannerItem[]
}) {
  const [active, setActive] = useState(0)
  const [hasError, setHasError] = useState(false)

  // Reset error state ketika banner aktif berganti
  useEffect(() => {
    setHasError(false)
  }, [active])

  useEffect(() => {
    if (items.length <= 1) return

    const timer = setInterval(() => {
      setActive(current =>
        current >= items.length - 1
          ? 0
          : current + 1
      )
    }, 4000)

    return () => clearInterval(timer)
  }, [items.length])

  const currentItems = items.length > 0 ? items : defaultBanners
  const banner = currentItems[active] || currentItems[0]

  return (
    <section className="px-4 py-2 sm:py-4">
      <div className="mx-auto max-w-7xl relative">
        {/* Subtle Blue Aurora Glow di belakang banner */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#42A5F5]/20 to-transparent rounded-2xl blur-xl opacity-30 pointer-events-none"></div>

        <a
          href={banner.link || '#'}
          className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-gray-950/80 backdrop-blur-md shadow-xl transition-all hover:border-[#42A5F5]/40"
        >
          <div className="relative aspect-[16/9] sm:aspect-[21/9] md:aspect-[3/1] w-full overflow-hidden flex items-center justify-center">

            {!hasError && banner.image ? (
              <img
                src={banner.image}
                alt={banner.title || 'Ellaria Banner'}
                onError={() => setHasError(true)}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              /* Fallback Glassmorphism jika gambar kosong atau gagal dimuat */
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black flex flex-col items-center justify-center p-6 text-center">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#42A5F5]/10 rounded-full blur-2xl pointer-events-none"></div>
                <span className="text-xs uppercase tracking-widest text-[#42A5F5] font-semibold mb-1 px-3 py-1 rounded-full bg-[#42A5F5]/10 border border-[#42A5F5]/20">
                  Ellaria Featured
                </span>
                <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight mt-1">
                  {banner.title || 'Jelajahi Seri & Novel Terbaik'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-md">
                  Temukan update chapter terbaru setiap harinya.
                </p>
              </div>
            )}

            {/* Gradient Overlay agar teks judul tetap kontras jika gambar berhasil dimuat */}
            {!hasError && banner.image && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4 sm:p-6 z-10">
                  <span className="inline-block text-[10px] sm:text-xs font-semibold text-[#42A5F5] uppercase tracking-wider mb-1 px-2.5 py-0.5 rounded bg-[#42A5F5]/20 border border-[#42A5F5]/30">
                    Featured
                  </span>
                  <h1 className="text-base sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
                    {banner.title}
                  </h1>
                </div>
              </>
            )}

          </div>
        </a>

        {currentItems.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {currentItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setActive(index)}
                aria-label={`Banner ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === active
                    ? 'w-7 bg-[#42A5F5]'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  )
}
