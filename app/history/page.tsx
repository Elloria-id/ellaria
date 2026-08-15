'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/history')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHistory(data.data)
        }
        setLoading(false)
      })
  }, [])

  const clearHistory = async () => {
    if (!confirm('Hapus semua riwayat?')) return
    await fetch('/api/history?all=true', { method: 'DELETE' })
    setHistory([])
  }

  const removeItem = async (id: string) => {
    await fetch(`/api/history?id=${id}`, { method: 'DELETE' })
    setHistory(history.filter((h) => h.id !== id))
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Riwayat Membaca</h1>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="btn-secondary text-red-400 text-sm"
          >
            Hapus Semua
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Belum ada riwayat membaca</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between glass-card p-4"
            >
              <Link
                href={`/reader/${item.series.slug}/${item.chapterId}`}
                className="flex-1 flex items-center space-x-4"
              >
                <div className="w-16 h-20 rounded-lg overflow-hidden">
                  <img
                    src={item.series.cover || '/images/placeholder-cover.jpg'}
                    alt={item.series.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium">{item.series.title}</h3>
                  <p className="text-sm text-gray-400">
                    Chapter {item.chapter.chapterNumber}
                    {item.chapter.title && ` - ${item.chapter.title}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.lastReadAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => removeItem(item.id)}
                className="p-2 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
