'use client'

import { useEffect, useState } from 'react'

type Series = {
  id: string
  title: string
  slug: string
  cover: string | null
  type: string
  status: string
  label: string
  published: boolean
  isPremium: boolean
  is18Plus: boolean
  _count?: {
    chapters: number
    bookmarks: number
    comments: number
  }
}

const emptyForm = {
  title: '',
  slug: '',
  type: 'MANGA',
  status: 'ONGOING',
  label: 'NORMAL',
  cover: '',
  description: '',
  author: '',
  artist: '',
  is18Plus: false,
  isPremium: false,
  published: true,
}

export default function AdminSeriesPage() {
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  async function loadSeries() {
    try {
      setLoading(true)

      const params = new URLSearchParams()

      if (search) {
        params.set('search', search)
      }

      const response = await fetch(
        `/api/admin/series?${params.toString()}`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengambil series')
      }

      setSeries(data.series || [])
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Gagal mengambil series'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSeries()
  }, [])

  function updateField(
    field: keyof typeof emptyForm,
    value: string | boolean
  ) {
    setForm(current => ({
      ...current,
      [field]: value,
    }))
  }

  function startEdit(item: Series) {
    setEditingId(item.id)

    setForm({
      ...emptyForm,
      title: item.title,
      slug: item.slug,
      type: item.type,
      status: item.status,
      label: item.label,
      cover: item.cover || '',
      published: item.published,
      isPremium: item.isPremium,
      is18Plus: item.is18Plus,
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function saveSeries(event: React.FormEvent) {
    event.preventDefault()

    if (!form.title.trim() || !form.slug.trim()) {
      alert('Title dan slug wajib diisi')
      return
    }

    try {
      setSaving(true)

      const response = await fetch('/api/admin/series', {
        method: editingId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          editingId
            ? {
                id: editingId,
                ...form,
              }
            : form
        ),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Gagal menyimpan series'
        )
      }

      resetForm()
      await loadSeries()
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan series'
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteSeries(id: string) {
    const confirmed = window.confirm(
      'Yakin ingin menghapus series ini? Semua chapter terkait juga dapat ikut terhapus.'
    )

    if (!confirmed) return

    const response = await fetch('/api/admin/series', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    })

    const data = await response.json()

    if (!response.ok) {
      alert(data.message || 'Gagal menghapus series')
      return
    }

    await loadSeries()
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-bold">
          Manajemen Series
        </h1>

        <form
          onSubmit={saveSeries}
          className="mb-8 rounded-xl border border-white/10 bg-white/5 p-5"
        >
          <h2 className="mb-4 text-lg font-semibold">
            {editingId ? 'Edit Series' : 'Tambah Series'}
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={form.title}
              onChange={e =>
                updateField('title', e.target.value)
              }
              placeholder="Judul"
              className="rounded-lg border border-white/10 bg-black px-4 py-3"
            />

            <input
              value={form.slug}
              onChange={e =>
                updateField('slug', e.target.value)
              }
              placeholder="slug-contoh"
              className="rounded-lg border border-white/10 bg-black px-4 py-3"
            />

            <select
              value={form.type}
              onChange={e =>
                updateField('type', e.target.value)
              }
              className="rounded-lg border border-white/10 bg-black px-4 py-3"
            >
              <option value="MANGA">Manga</option>
              <option value="MANHWA">Manhwa</option>
              <option value="MANHUA">Manhua</option>
              <option value="NOVEL">Novel</option>
              <option value="ONE_SHOT">One Shot</option>
            </select>

            <select
              value={form.status}
              onChange={e =>
                updateField('status', e.target.value)
              }
              className="rounded-lg border border-white/10 bg-black px-4 py-3"
            >
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="HIATUS">Hiatus</option>
            </select>

            <select
              value={form.label}
              onChange={e =>
                updateField('label', e.target.value)
              }
              className="rounded-lg border border-white/10 bg-black px-4 py-3"
            >
              <option value="NORMAL">Normal</option>
              <option value="ADULT">Adult</option>
              <option value="GORE">Gore</option>
              <option value="PREMIUM">Premium</option>
            </select>

            <input
              value={form.cover}
              onChange={e =>
                updateField('cover', e.target.value)
              }
              placeholder="URL cover"
              className="rounded-lg border border-white/10 bg-black px-4 py-3"
            />
          </div>

          <textarea
            value={form.description}
            onChange={e =>
              updateField('description', e.target.value)
            }
            placeholder="Deskripsi"
            className="mt-4 min-h-28 w-full rounded-lg border border-white/10 bg-black px-4 py-3"
          />

          <div className="mt-4 flex flex-wrap gap-5">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is18Plus}
                onChange={e =>
                  updateField('is18Plus', e.target.checked)
                }
              />
              18+
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isPremium}
                onChange={e =>
                  updateField('isPremium', e.target.checked)
                }
              />
              Premium
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.published}
                onChange={e =>
                  updateField('published', e.target.checked)
                }
              />
              Published
            </label>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-500 px-5 py-3 font-semibold disabled:opacity-50"
            >
              {saving
                ? 'Menyimpan...'
                : editingId
                  ? 'Simpan Perubahan'
                  : 'Tambah Series'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-white/10 px-5 py-3"
              >
                Batal
              </button>
            )}
          </div>
        </form>

        <div className="mb-5 flex gap-2">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                loadSeries()
              }
            }}
            placeholder="Cari series..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3"
          />

          <button
            onClick={loadSeries}
            className="rounded-lg bg-blue-500 px-5 py-3 font-semibold"
          >
            Cari
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center">
            Memuat series...
          </div>
        ) : series.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
            Belum ada series.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {series.map(item => (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
              >
                {item.cover && (
                  <img
                    src={item.cover}
                    alt={item.title}
                    className="aspect-video w-full object-cover"
                  />
                )}

                <div className="p-4">
                  <h3 className="font-semibold">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-sm text-white/50">
                    {item.type} · {item.status}
                  </p>

                  <p className="mt-2 text-sm text-white/60">
                    {item._count?.chapters || 0} chapter
                  </p>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => startEdit(item)}
                      className="rounded bg-white/10 px-3 py-2 text-sm"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteSeries(item.id)}
                      className="rounded bg-red-500/20 px-3 py-2 text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
