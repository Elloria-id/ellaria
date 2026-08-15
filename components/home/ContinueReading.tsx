'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export function ContinueReading() {
  const [progress, setProgress] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/reader/continue')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProgress(data.data)
        }
      })
  }, [])

  if (progress.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Lanjut Membaca</h2>
        <Link href="/history" className="text-sm text-primary hover:underline">
          Lihat Semua
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {progress.map((item) => (
          <Link
            key={item.id}
            href={`/reader/${item.series.slug}/${item.chapterId}`}
            className="glass-card p-4 hover:border-primary/50 transition-all"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg mb-3">
              <img
                src={item.series.cover || '/images/placeholder-cover.jpg'}
                alt={item.series.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-dark-300">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(item.progress || 0) * 100}%` }}
                />
              </div>
            </div>
            <h3 className="font-medium truncate">{item.series.title}</h3>
            <p className="text-sm text-gray-400">
              Chapter {item.chapter.chapterNumber}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
