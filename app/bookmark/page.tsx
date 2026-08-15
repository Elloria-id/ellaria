'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function BookmarkPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bookmarks')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBookmarks(data.data)
        }
        setLoading(false)
      })
  }, [])

  const removeBookmark = async (seriesId: string) => {
    await fetch(`/api/bookmarks?seriesId=${seriesId}`, {
      method: 'DELETE',
    })
    setBookmarks(bookmarks.filter((b) => b.seriesId !== seriesId))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Bookmark</h1>

      {bookmarks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Belum ada bookmark</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="glass-card p-4">
              <Link href={`/series/${bookmark.series.slug}`}>
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg mb-3">
                  <img
                    src={bookmark.series.cover || '/images/placeholder-cover.jpg'}
                    alt={bookmark.series.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium truncate">{bookmark.series.title}</h3>
              </Link>
              <button
                onClick={() => removeBookmark(bookmark.seriesId)}
                className="mt-2 w-full btn-secondary text-sm text-red-400"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
