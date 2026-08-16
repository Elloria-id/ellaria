'use client'

import { FormEvent, useEffect, useState } from 'react'

type Series = {
  id: string
  title: string
  slug: string
  type: string
  description: string | null
  cover: string | null
  createdAt: string
  _count?: {
    chapters: number
    bookmarks: number
  }
}

export default function AdminSeriesPage() {
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    slug: '',
    type: 'MANHWA',
    description: '',
    cover: '',
  })

  async function loadSeries() {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()

      if (search.trim()) {
        params.set('search', search.trim())
      }

      if (type) {
        params.set('type', type)
      }

      params.set('page', String(page))
      params.set('limit', '20')

      const response = await fetch(
        `/api/admin/series?${params.toString()}`,
        {
          cache: 'no-store',
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal mengambil series'
        )
      }

      setSeries(result.data || [])
      setTotalPages(result.pagination?.totalPages || 1)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSeries()
  }, [page, type])

  function makeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  function handleTitleChange(value: string) {
    setForm(current => ({
      ...current,
      title: value,
      slug: current.slug || makeSlug(value),
    }))
  }

  async function createSeries(event: FormEvent) {
    event.preventDefault()

    if (!form.title.trim() || !form.slug.trim()) {
      alert('Title dan slug wajib diisi.')
      return
    }

    try {
      setSaving(true)

      const response = await fetch('/api/admin/series', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal membuat series'
        )
      }

      setForm({
        title: '',
        slug: '',
        type: 'MANHWA',
        description: '',
        cover: '',
      })

      setShowForm(false)
      setPage(1)
      await loadSeries()
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Gagal membuat series'
      )
    } finally {
      setSaving(false)
    }
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    setPage(1)
    loadSeries()
  }

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Admin Series
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              Kelola manga, manhwa, manhua, novel, dan
              series Ellaria.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(current => !current)}
            className="rounded-xl bg-[#42A5F5] px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            {showForm ? 'Tutup Form' : '+ Tambah Series'}
          </button>
        </div>

        {/* CREATE FORM */}

        {showForm && (
          <form
            onSubmit={createSeries}
            className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <h2 className="mb-4 text-lg font-semibold">
              Tambah Series
            </h2>

            <div className="grid gap-4 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-xs text-gray-400">
                  Judul
                </label>

                <input
                  value={form.title}
                  onChange={event =>
                    handleTitleChange(event.target.value)
                  }
                  placeholder="Contoh: Solo Leveling"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#42A5F5]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-gray-400">
                  Slug
                </label>

                <input
                  value={form.slug}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      slug: makeSlug(event.target.value),
                    }))
                  }
                  placeholder="solo-leveling"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#42A5F5]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-gray-400">
                  Tipe
                </label>

                <select
                  value={form.type}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      type: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0b1016] px-4 py-3 text-sm outline-none focus:border-[#42A5F5]"
                >
                  <option value="MANHWA">MANHWA</option>
                  <option value="MANGA">MANGA</option>
                  <option value="MANHUA">MANHUA</option>
                  <option value="NOVEL">NOVEL</option>
                  <option value="ONE_SHOT">ONE SHOT</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs text-gray-400">
                  URL Cover
                </label>

                <input
                  value={form.cover}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      cover: event.target.value,
                    }))
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#42A5F5]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs text-gray-400">
                  Deskripsi
                </label>

                <textarea
                  value={form.description}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Deskripsi series..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#42A5F5]"
                />
              </div>

            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 rounded-xl bg-[#42A5F5] px-6 py-3 text-sm font-semibold text-black disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Series'}
            </button>
          </form>
        )}

        {/* SEARCH */}

        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 md:flex-row"
          >
            <input
              value={search}
              onChange={event =>
                setSearch(event.target.value)
              }
              placeholder="Cari judul atau slug..."
              className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-black/30 px-4 text-sm outline-none focus:border-[#42A5F5]"
            />

            <select
              value={type}
              onChange={event => {
                setType(event.target.value)
                setPage(1)
              }}
              className="min-h-[44px] rounded-xl border border-white/10 bg-[#0b1016] px-4 text-sm outline-none focus:border-[#42A5F5]"
            >
              <option value="">Semua Tipe</option>
              <option value="MANHWA">MANHWA</option>
              <option value="MANGA">MANGA</option>
              <option value="MANHUA">MANHUA</option>
              <option value="NOVEL">NOVEL</option>
              <option value="ONE_SHOT">ONE SHOT</option>
            </select>

            <button
              type="submit"
              className="min-h-[44px] rounded-xl bg-[#42A5F5] px-6 text-sm font-semibold text-black"
            >
              Cari
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* SERIES LIST */}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

          {loading ? (
            <div className="p-10 text-center text-sm text-gray-400">
              Memuat series...
            </div>
          ) : series.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              Belum ada series.
            </div>
          ) : (
            <div className="divide-y divide-white/10">

              {series.map(item => (
                <div
                  key={item.id}
                  className="p-4 hover:bg-white/[0.02]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                    {/* COVER */}

                    <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5">
                      {item.cover ? (
                        <img
                          src={item.cover}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-gray-500">
                          NO COVER
                        </div>
                      )}
                    </div>

                    {/* INFO */}

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">
                          {item.title}
                        </h3>

                        <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-gray-400">
                          {item.type}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-gray-500">
                        /{item.slug}
                      </p>

                      {item.description && (
                        <p className="mt-2 line-clamp-2 text-xs text-gray-400">
                          {item.description}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-gray-500">
                        <span>
                          {item._count?.chapters || 0} Chapters
                        </span>

                        <span>
                          {item._count?.bookmarks || 0} Bookmarks
                        </span>
                      </div>

                    </div>

                  </div>
                </div>
              ))}

            </div>
          )}

        </div>

        {/* PAGINATION */}

        <div className="mt-5 flex items-center justify-center gap-3">

          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() =>
              setPage(current =>
                Math.max(current - 1, 1)
              )
            }
            className="rounded-lg border border-white/10 px-4 py-2 text-sm disabled:opacity-30"
          >
            Sebelumnya
          </button>

          <span className="text-sm text-gray-400">
            {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() =>
              setPage(current =>
                Math.min(current + 1, totalPages)
              )
            }
            className="rounded-lg border border-white/10 px-4 py-2 text-sm disabled:opacity-30"
          >
            Berikutnya
          </button>

        </div>

      </div>
    </main>
  )
}
