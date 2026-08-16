'use client'

import { FormEvent, useEffect, useState } from 'react'

type Series = {
  id: string
  title: string
}

type Chapter = {
  id: string
  number: number
  title: string
  slug: string
  coinPrice: number
  series: Series
}

export default function AdminChaptersPage() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [seriesId, setSeriesId] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    seriesId: '',
    number: '',
    title: '',
    slug: '',
    coinPrice: '0',
  })

  async function loadSeries() {
    try {
      const response = await fetch(
        '/api/admin/series?limit=100'
      )

      const result = await response.json()

      if (result.success) {
        setSeries(result.data || [])
      }
    } catch {
      // handled silently
    }
  }

  async function loadChapters() {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()

      if (seriesId) {
        params.set('seriesId', seriesId)
      }

      if (search.trim()) {
        params.set('search', search.trim())
      }

      const response = await fetch(
        `/api/admin/chapters?${params.toString()}`,
        {
          cache: 'no-store',
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal mengambil chapter'
        )
      }

      setChapters(result.data || [])
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
  }, [])

  useEffect(() => {
    loadChapters()
  }, [seriesId])

  async function createChapter(event: FormEvent) {
    event.preventDefault()

    try {
      setSaving(true)

      const response = await fetch(
        '/api/admin/chapters',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal membuat chapter'
        )
      }

      setForm({
        seriesId: '',
        number: '',
        title: '',
        slug: '',
        coinPrice: '0',
      })

      setShowForm(false)

      await loadChapters()
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Gagal membuat chapter'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Admin Chapters
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              Kelola chapter dan harga coin.
            </p>
          </div>

          <button
            onClick={() =>
              setShowForm(current => !current)
            }
            className="rounded-xl bg-[#42A5F5] px-5 py-3 text-sm font-semibold text-black"
          >
            {showForm
              ? 'Tutup Form'
              : '+ Tambah Chapter'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={createChapter}
            className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <h2 className="mb-4 text-lg font-semibold">
              Tambah Chapter
            </h2>

            <div className="grid gap-4 md:grid-cols-2">

              <select
                value={form.seriesId}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    seriesId: event.target.value,
                  }))
                }
                className="rounded-xl border border-white/10 bg-[#0b1016] px-4 py-3 text-sm outline-none"
              >
                <option value="">
                  Pilih Series
                </option>

                {series.map(item => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.title}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                value={form.number}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    number: event.target.value,
                  }))
                }
                placeholder="Nomor chapter"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
              />

              <input
                value={form.title}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Judul chapter"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
              />

              <input
                value={form.slug}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    slug: event.target.value
                      .toLowerCase()
                      .replace(/\s+/g, '-'),
                  }))
                }
                placeholder="chapter-1"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
              />

              <input
                type="number"
                min="0"
                value={form.coinPrice}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    coinPrice: event.target.value,
                  }))
                }
                placeholder="Harga coin"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
              />

            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 rounded-xl bg-[#42A5F5] px-6 py-3 text-sm font-semibold text-black disabled:opacity-50"
            >
              {saving
                ? 'Menyimpan...'
                : 'Simpan Chapter'}
            </button>
          </form>
        )}

        <div className="mb-6 flex flex-col gap-3 md:flex-row">

          <input
            value={search}
            onChange={event =>
              setSearch(event.target.value)
            }
            onKeyDown={event => {
              if (event.key === 'Enter') {
                loadChapters()
              }
            }}
            placeholder="Cari chapter..."
            className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
          />

          <select
            value={seriesId}
            onChange={event =>
              setSeriesId(event.target.value)
            }
            className="rounded-xl border border-white/10 bg-[#0b1016] px-4 py-3 text-sm outline-none"
          >
            <option value="">
              Semua Series
            </option>

            {series.map(item => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.title}
              </option>
            ))}
          </select>

          <button
            onClick={loadChapters}
            className="rounded-xl bg-[#42A5F5] px-6 py-3 text-sm font-semibold text-black"
          >
            Cari
          </button>

        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

          {loading ? (
            <div className="p-10 text-center text-gray-400">
              Memuat chapter...
            </div>
          ) : chapters.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              Belum ada chapter.
            </div>
          ) : (
            <div className="divide-y divide-white/10">

              {chapters.map(chapter => (
                <div
                  key={chapter.id}
                  className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">
                      Chapter {chapter.number} —{' '}
                      {chapter.title}
                    </p>

                    <p className="text-xs text-gray-500">
                      {chapter.series.title}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      /{chapter.slug}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#42A5F5]/10 px-3 py-2 text-sm text-[#42A5F5]">
                    {chapter.coinPrice} Coin
                  </div>
                </div>
              ))}

            </div>
          )}

        </div>

      </div>
    </main>
  )
}
