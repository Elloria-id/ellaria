'use client'

import { FormEvent, useEffect, useState } from 'react'

type Banner = {
  id: string
  title: string
  image: string
  link: string | null
  order: number
  active: boolean
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    image: '',
    link: '',
    order: '0',
  })

  async function loadBanners() {
    try {
      setLoading(true)

      const response = await fetch(
        '/api/admin/banners',
        { cache: 'no-store' }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal mengambil banner'
        )
      }

      setBanners(result.data || [])
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
    loadBanners()
  }, [])

  async function createBanner(event: FormEvent) {
    event.preventDefault()

    try {
      setSaving(true)

      const response = await fetch(
        '/api/admin/banners',
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
          result.message || 'Gagal membuat banner'
        )
      }

      setForm({
        title: '',
        image: '',
        link: '',
        order: '0',
      })

      setShowForm(false)

      await loadBanners()
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Gagal membuat banner'
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
              Admin Banners
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              Kelola banner utama Ellaria.
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
              : '+ Tambah Banner'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={createBanner}
            className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <h2 className="mb-4 text-lg font-semibold">
              Tambah Banner
            </h2>

            <div className="grid gap-4">

              <input
                value={form.title}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Judul banner"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
              />

              <input
                value={form.image}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    image: event.target.value,
                  }))
                }
                placeholder="URL gambar banner"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
              />

              <input
                value={form.link}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    link: event.target.value,
                  }))
                }
                placeholder="Link tujuan (opsional)"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
              />

              <input
                type="number"
                value={form.order}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    order: event.target.value,
                  }))
                }
                placeholder="Urutan"
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
                : 'Simpan Banner'}
            </button>
          </form>
        )}

        {error && (
          <div className="mb-5 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">

          {loading ? (
            <div className="text-gray-400">
              Memuat banner...
            </div>
          ) : banners.length === 0 ? (
            <div className="text-gray-400">
              Belum ada banner.
            </div>
          ) : (
            banners.map(banner => (
              <div
                key={banner.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                <div className="aspect-video bg-black">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="p-4">
                  <h3 className="font-semibold">
                    {banner.title}
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Order: {banner.order}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {banner.active
                      ? 'Aktif'
                      : 'Nonaktif'}
                  </p>
                </div>
              </div>
            ))
          )}

        </div>

      </div>
    </main>
  )
}
