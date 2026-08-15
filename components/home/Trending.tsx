'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function Trending() {
  const [series, setSeries] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/series?limit=10&sort=views')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSeries(data.data.series)
        }
      })
  }, [])

  if (series.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Trending</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {series.map((item) => (
          <Link
            key={item.id}
            href={`/series/${item.slug}`}
            className="group"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
              <img
                src={item.cover || '/images/placeholder-cover.jpg'}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {item.isPremium && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-primary/80 text-white text-xs rounded">
                  Premium
                </div>
              )}
              {item.is18Plus && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-red-500/80 text-white text-xs rounded">
                  18+
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <h3 className="text-sm font-medium truncate">{item.title}</h3>
                <p className="text-xs text-gray-400">
                  {item.chapters?.[0] ? `Chapter ${item.chapters[0].chapterNumber}` : 'New'}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
