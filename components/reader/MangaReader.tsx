'use client'

import { useEffect, useState } from 'react'

type MangaReaderProps = {
  chapterId: string
  title?: string
  images?: string[]
  coinPrice?: number
}

export default function MangaReader({
  chapterId,
  title = 'Chapter',
  images = [],
  coinPrice = 0,
}: MangaReaderProps) {
  const [brightness, setBrightness] = useState(100)
  const [viewMode, setViewMode] = useState<'scroll' | 'paged'>(
    'scroll'
  )
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [chapterId])

  function nextPage() {
    setCurrentPage(current =>
      Math.min(current + 1, images.length - 1)
    )
  }

  function previousPage() {
    setCurrentPage(current =>
      Math.max(current - 1, 0)
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-gray-400">
        Memuat chapter...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">

      {/* READER HEADER */}

      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {title}
            </p>

            <p className="text-[10px] text-gray-500">
              {viewMode === 'scroll'
                ? 'Continuous Scroll'
                : `Page ${currentPage + 1} / ${images.length}`}
            </p>
          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={() =>
                setViewMode('scroll')
              }
              className={`rounded-lg px-3 py-2 text-xs ${
                viewMode === 'scroll'
                  ? 'bg-[#42A5F5] text-black'
                  : 'bg-white/10'
              }`}
            >
              Scroll
            </button>

            <button
              onClick={() =>
                setViewMode('paged')
              }
              className={`rounded-lg px-3 py-2 text-xs ${
                viewMode === 'paged'
                  ? 'bg-[#42A5F5] text-black'
                  : 'bg-white/10'
              }`}
            >
              Page
            </button>

          </div>

        </div>
      </header>

      {/* CONTROLS */}

      <div className="sticky top-[53px] z-40 border-b border-white/5 bg-black/80 px-4 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3">

          <span className="text-xs text-gray-500">
            Brightness
          </span>

          <input
            type="range"
            min="50"
            max="100"
            value={brightness}
            onChange={event =>
              setBrightness(Number(event.target.value))
            }
            className="w-32 accent-[#42A5F5]"
          />

          <span className="text-xs text-gray-500">
            {brightness}%
          </span>

        </div>
      </div>

      {/* READER */}

      <div
        style={{
          filter: `brightness(${brightness}%)`,
        }}
      >

        {images.length === 0 ? (
          <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-5 text-center text-sm text-gray-500">
            Belum ada halaman chapter.
          </div>
        ) : viewMode === 'scroll' ? (

          <div className="mx-auto max-w-4xl">

            {images.map((image, index) => (
              <img
                key={`${chapterId}-${index}`}
                src={image}
                alt={`${title} page ${index + 1}`}
                loading={index < 2 ? 'eager' : 'lazy'}
                className="block h-auto w-full"
              />
            ))}

          </div>

        ) : (

          <div className="flex min-h-[80vh] items-center justify-center px-3">

            <img
              src={images[currentPage]}
              alt={`${title} page ${currentPage + 1}`}
              className="max-h-[80vh] max-w-full object-contain"
            />

          </div>

        )}

      </div>

      {/* PAGE NAVIGATION */}

      {viewMode === 'paged' && images.length > 0 && (
        <div className="sticky bottom-0 border-t border-white/10 bg-black/90 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between">

            <button
              onClick={previousPage}
              disabled={currentPage === 0}
              className="rounded-xl bg-white/10 px-5 py-3 text-sm disabled:opacity-30"
            >
              Sebelumnya
            </button>

            <span className="text-xs text-gray-400">
              {currentPage + 1} / {images.length}
            </span>

            <button
              onClick={nextPage}
              disabled={
                currentPage >= images.length - 1
              }
              className="rounded-xl bg-[#42A5F5] px-5 py-3 text-sm font-semibold text-black disabled:opacity-30"
            >
              Berikutnya
            </button>

          </div>
        </div>
      )}

      {/* COIN INFO */}

      {coinPrice > 0 && (
        <div className="border-t border-white/10 bg-[#05070a] px-4 py-5 text-center text-xs text-gray-500">
          Chapter premium · {coinPrice} Coin
        </div>
      )}

    </main>
  )
}
