'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Maximize, Minimize, Bookmark, Settings } from 'lucide-react'

interface MangaReaderProps {
  chapterId: string
  seriesId: string
  images: Array<{
    id: string
    pageNumber: number
    url: string
    storageKey: string
  }>
  chapter: {
    id: string
    chapterNumber: number
    title: string
  }
  series: {
    id: string
    title: string
    slug: string
  }
  nextChapter?: {
    id: string
    chapterNumber: number
  }
  prevChapter?: {
    id: string
    chapterNumber: number
  }
  onProgressUpdate?: (page: number) => void
}

export function MangaReader({
  chapterId,
  seriesId,
  images,
  chapter,
  series,
  nextChapter,
  prevChapter,
  onProgressUpdate,
}: MangaReaderProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [scrollMode, setScrollMode] = useState<'scroll' | 'single'>('scroll')
  const [showControls, setShowControls] = useState(true)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeout = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Load saved progress
    const savedProgress = localStorage.getItem(
      `progress-${seriesId}-${chapterId}`
    )
    if (savedProgress) {
      const page = parseInt(savedProgress, 10)
      if (page < images.length) {
        setCurrentPage(page)
      }
    }
    setIsLoading(false)

    // Check bookmark status
    checkBookmark()
  }, [seriesId, chapterId, images.length])

  useEffect(() => {
    // Save progress
    localStorage.setItem(
      `progress-${seriesId}-${chapterId}`,
      String(currentPage)
    )
    onProgressUpdate?.(currentPage)

    // Scroll to current page in scroll mode
    if (scrollMode === 'scroll' && containerRef.current) {
      const pageElements = containerRef.current.querySelectorAll('[data-page]')
      if (pageElements[currentPage]) {
        pageElements[currentPage].scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }
  }, [currentPage, seriesId, chapterId, onProgressUpdate, scrollMode])

  const checkBookmark = async () => {
    try {
      const res = await fetch(`/api/bookmarks?seriesId=${seriesId}`)
      const data = await res.json()
      if (data.success && data.data) {
        setIsBookmarked(data.data.some((b: any) => b.seriesId === seriesId))
      }
    } catch {
      // Silently fail
    }
  }

  const toggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await fetch(`/api/bookmarks?seriesId=${seriesId}`, {
          method: 'DELETE',
        })
        setIsBookmarked(false)
      } else {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seriesId }),
        })
        setIsBookmarked(true)
      }
    } catch {
      // Silently fail
    }
  }

  const handleNextPage = () => {
    if (currentPage < images.length - 1) {
      setCurrentPage(currentPage + 1)
    } else if (nextChapter) {
      router.push(`/reader/${series.slug}/${nextChapter.id}`)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    } else if (prevChapter) {
      router.push(`/reader/${series.slug}/${prevChapter.id}`)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevPage()
    if (e.key === 'ArrowRight') handleNextPage()
    if (e.key === 'f') toggleFullscreen()
    if (e.key === ' ') {
      e.preventDefault()
      setShowControls(!showControls)
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, images.length, nextChapter, prevChapter, showControls])

  // Auto-hide controls
  useEffect(() => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current)
    }
    controlsTimeout.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current)
      }
    }
  }, [showControls])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-500">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-500">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-400">Tidak ada gambar</h2>
          <p className="text-gray-500 mt-2">Chapter ini belum memiliki konten</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-500 pt-16 pb-8">
      {/* Reader Header */}
      <div
        className={`sticky top-16 z-30 glass border-b border-glass-border p-4 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
        onMouseEnter={() => setShowControls(true)}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium">{series.title}</h1>
            <p className="text-sm text-gray-400">
              Chapter {chapter.chapterNumber}: {chapter.title || 'Untitled'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleBookmark}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Bookmark"
            >
              <Bookmark
                className={`w-5 h-5 ${isBookmarked ? 'fill-primary text-primary' : 'text-gray-400'}`}
              />
            </button>
            <button
              onClick={() => setScrollMode(scrollMode === 'scroll' ? 'single' : 'scroll')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Toggle scroll mode"
            >
              {scrollMode === 'scroll' ? 'Scroll' : 'Single'}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className={`sticky top-20 z-30 h-1 bg-dark-300 transition-all duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{
            width: `${((currentPage + 1) / images.length) * 100}%`,
          }}
        />
      </div>

      {/* Reader Content */}
      <div
        className="container mx-auto px-4 py-8"
        onClick={() => setShowControls(true)}
        ref={containerRef}
      >
        {scrollMode === 'scroll' ? (
          <div className="flex flex-col items-center space-y-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                data-page={index}
                className="relative max-w-3xl w-full"
              >
                <img
                  src={image.url}
                  alt={`Page ${image.pageNumber}`}
                  className="w-full h-auto rounded-lg shadow-xl"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  onClick={() => setShowControls(true)}
                />
                <div className="absolute bottom-4 right-4 glass px-3 py-1 rounded-lg text-sm text-gray-300">
                  {image.pageNumber} / {images.length}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[80vh]">
            <button
              onClick={handlePrevPage}
              className={`fixed left-4 z-20 p-4 rounded-full glass hover:bg-white/10 transition-colors ${
                !showControls ? 'opacity-0 pointer-events-none' : ''
              }`}
              disabled={currentPage === 0 && !prevChapter}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="relative max-w-3xl w-full">
              <img
                src={images[currentPage]?.url}
                alt={`Page ${images[currentPage]?.pageNumber}`}
                className="w-full h-auto rounded-lg shadow-xl"
                onClick={() => setShowControls(true)}
              />
              <div className="absolute bottom-4 right-4 glass px-3 py-1 rounded-lg text-sm text-gray-300">
                {images[currentPage]?.pageNumber} / {images.length}
              </div>
            </div>

            <button
              onClick={handleNextPage}
              className={`fixed right-4 z-20 p-4 rounded-full glass hover:bg-white/10 transition-colors ${
                !showControls ? 'opacity-0 pointer-events-none' : ''
              }`}
              disabled={currentPage === images.length - 1 && !nextChapter}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* Chapter Navigation */}
      <div className="container mx-auto px-4 mt-8">
        <div className="flex items-center justify-between glass rounded-lg p-4">
          <button
            onClick={() => router.push(`/series/${series.slug}`)}
            className="btn-secondary"
          >
            Kembali ke Series
          </button>
          <div className="flex space-x-2">
            {prevChapter && (
              <button
                onClick={() => router.push(`/reader/${series.slug}/${prevChapter.id}`)}
                className="btn-secondary"
              >
                ← Chapter Sebelumnya
              </button>
            )}
            {nextChapter && (
              <button
                onClick={() => router.push(`/reader/${series.slug}/${nextChapter.id}`)}
                className="btn-primary"
              >
                Chapter Selanjutnya →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
