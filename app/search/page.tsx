'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Filter } from 'lucide-react'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialType = searchParams.get('type') || 'series'

  const [query, setQuery] = useState(initialQuery)
  const [type, setType] = useState(initialType)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [filters, setFilters] = useState({
    genre: '',
    status: '',
    contentType: '',
  })

  const performSearch = async (resetPage = true) => {
    setLoading(true)
    const params = new URLSearchParams({
      q: query,
      type,
      page: String(resetPage ? 1 : page),
      limit: '20',
    })

    if (filters.genre) params.append('genre', filters.genre)
    if (filters.status) params.append('status', filters.status)
    if (filters.contentType) params.append('contentType', filters.contentType)

    try {
      const res = await fetch(`/api/search?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setResults(data.data.results)
        setTotalPages(data.data.pagination.pages)
        if (resetPage) setPage(1)
      }
    } catch {
      // Silently fail
    }
    setLoading(false)
  }

  useEffect(() => {
    performSearch(true)
  }, [type, filters])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query !== initialQuery) {
        performSearch(true)
      }
    }, 500)
    return () => clearTimeout(timeout)
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(true)
  }

  const loadMore = () => {
    setPage(page + 1)
    performSearch(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Pencarian</h1>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari series, user, komunitas..."
            className="flex-1 bg-dark-400/50 border border-glass-border rounded-lg p-3 focus:outline-none focus:border-primary"
          />
          <button type="submit" className="btn-primary">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="bg-dark-400/50 border border-glass-border rounded-lg p-2 focus:outline-none focus:border-primary"
        >
          <option value="series">Series</option>
          <option value="user">User</option>
          <option value="translator">Translator</option>
          <option value="community">Community</option>
        </select>

        <select
          value={filters.genre}
          onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
          className="bg-dark-400/50 border border-glass-border rounded-lg p-2 focus:outline-none focus:border-primary"
        >
          <option value="">Semua Genre</option>
          {/* Would populate from API */}
        </select>
      </div>

      {loading && page === 1 ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Tidak ada hasil ditemukan</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {results.map((item) => (
              <Link
                key={item.id}
                href={
                  type === 'series'
                    ? `/series/${item.slug}`
                    : `/profile/${item.username}`
                }
                className="glass-card p-4 hover:border-primary/50 transition-all"
              >
                {type === 'series' ? (
                  <>
                    <div className="relative aspect-[3/4] overflow-hidden rounded-lg mb-3">
                      <img
                        src={item.cover || '/images/placeholder-cover.jpg'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-medium truncate">{item.title}</h3>
                    <p className="text-sm text-gray-400">{item.type}</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        {item.avatar ? (
                          <img
                            src={item.avatar}
                            alt={item.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold">
                            {item.username[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{item.username}</h3>
                        <p className="text-sm text-gray-400">Level {item.level}</p>
                      </div>
                    </div>
                  </>
                )}
              </Link>
            ))}
          </div>

          {page < totalPages && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                disabled={loading}
                className="btn-secondary"
              >
                {loading ? 'Memuat...' : 'Muat Lebih Banyak'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
