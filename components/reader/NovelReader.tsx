'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Settings, Bookmark } from 'lucide-react'

interface NovelReaderProps {
  chapterId: string
  seriesId: string
  content: string
  chapter: {
    id: string
    chapterNumber: number
    title: string
    wordCount?: number
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
  onProgressUpdate?: (progress: number) => void
}

export function NovelReader({
  chapterId,
  seriesId,
  content,
  chapter,
  series,
  nextChapter,
  prevChapter,
  onProgressUpdate,
}: NovelReaderProps) {
  const router = useRouter()
  const [fontSize, setFontSize] = useState(18)
  const [lineHeight, setLineHeight] = useState(1.8)
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark')
  const [showSettings, setShowSettings] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load saved settings
    const savedFontSize = localStorage.getItem('novel-font-size')
    if (savedFontSize) setFontSize(parseInt(savedFontSize, 10))

    const savedLineHeight = localStorage.getItem('novel-line-height')
    if (savedLineHeight) setLineHeight(parseFloat(savedLineHeight))

    const savedTheme = localStorage.getItem('novel-theme')
    if (savedTheme) setTheme(savedTheme as any)

    // Load saved progress
    const savedProgress = localStorage.getItem(
      `novel-progress-${seriesId}-${chapterId}`
    )
    if (savedProgress) {
      setProgress(parseFloat(savedProgress))
    }

    checkBookmark()
  }, [seriesId, chapterId])

  useEffect(() => {
    // Save settings
    localStorage.setItem('novel-font-size', String(fontSize))
    localStorage.setItem('novel-line-height', String(lineHeight))
    localStorage.setItem('novel-theme', theme)
  }, [fontSize, lineHeight, theme])

  useEffect(() => {
    // Save progress on scroll
    const handleScroll = () => {
      if (!containerRef.current) return
      const scrollTop = window.scrollY
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const newProgress = Math.min(1, scrollTop / scrollHeight)
      setProgress(newProgress)
      localStorage.setItem(
        `novel-progress-${seriesId}-${chapterId}`,
        String(newProgress)
      )
      onProgressUpdate?.(newProgress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [seriesId, chapterId, onProgressUpdate])

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

  const getThemeStyles = () => {
    switch (theme) {
      case 'sepia':
        return {
          backgroundColor: '#f5e6d3',
          color: '#4a3728',
          borderColor: 'rgba(74,55,40,0.1)',
        }
      case 'light':
        return {
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          borderColor: 'rgba(0,0,0,0.1)',
        }
      default:
        return {
          backgroundColor: '#0a0a1a',
          color: '#e5e5e5',
          borderColor: 'rgba(255,255,255,0.1)',
        }
    }
  }

  const themeStyles = getThemeStyles()

  return (
    <div
      className="min-h-screen pt-16 pb-8 transition-colors duration-300"
      style={{ backgroundColor: themeStyles.backgroundColor, color: themeStyles.color }}
    >
      {/* Reader Header */}
      <div className="sticky top-16 z-30 glass border-b border-glass-border p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium">{series.title}</h1>
            <p className="text-sm text-gray-400">
              Chapter {chapter.chapterNumber}: {chapter.title || 'Untitled'}
              {chapter.wordCount && ` (${chapter.wordCount} kata)`}
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
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="sticky top-20 z-30 glass border-b border-glass-border p-4">
          <div className="container mx-auto flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Font Size:</span>
              <button
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                A-
              </button>
              <span className="text-sm">{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                A+
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Line Height:</span>
              <button
                onClick={() => setLineHeight(Math.max(1.2, lineHeight - 0.2))}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                -
              </button>
              <span className="text-sm">{lineHeight.toFixed(1)}</span>
              <button
                onClick={() => setLineHeight(Math.min(3, lineHeight + 0.2))}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                +
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Theme:</span>
              <button
                onClick={() => setTheme('dark')}
                className={`px-3 py-1 rounded ${
                  theme === 'dark' ? 'bg-primary text-white' : 'hover:bg-white/10'
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => setTheme('sepia')}
                className={`px-3 py-1 rounded ${
                  theme === 'sepia' ? 'bg-primary text-white' : 'hover:bg-white/10'
                }`}
              >
                Sepia
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`px-3 py-1 rounded ${
                  theme === 'light' ? 'bg-primary text-white' : 'hover:bg-white/10'
                }`}
              >
                Light
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="sticky top-20 z-20 h-1 bg-dark-300">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Novel Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div
            ref={containerRef}
            className="novel-content"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
              color: themeStyles.color,
            }}
            dangerouslySetInnerHTML={{
              __html: content
                .split('\n')
                .map((paragraph) => `<p class="mb-4">${paragraph}</p>`)
                .join(''),
            }}
          />
        </div>
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
