'use client'

import { useState } from 'react'

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState('Ellaria エル')
  const [waitSeconds, setWaitSeconds] = useState('6')
  const [coinPrice, setCoinPrice] = useState('1')
  const [saving, setSaving] = useState(false)

  async function saveSettings() {
    try {
      setSaving(true)

      const response = await fetch(
        '/api/admin/settings',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            siteName,
            waitSeconds: Number(waitSeconds),
            coinPrice: Number(coinPrice),
          }),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal menyimpan'
        )
      }

      alert('Pengaturan berhasil disimpan.')
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan pengaturan'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-3xl">

        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Admin Settings
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Pengaturan utama Ellaria.
          </p>
        </div>

        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">

          <div>
            <label className="mb-2 block text-sm text-gray-400">
              Nama Website
            </label>

            <input
              value={siteName}
              onChange={event =>
                setSiteName(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-[#42A5F5]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-400">
              Waktu Tunggu Unlock Gratis (detik)
            </label>

            <input
              type="number"
              min="0"
              value={waitSeconds}
              onChange={event =>
                setWaitSeconds(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-[#42A5F5]"
            />

            <p className="mt-1 text-xs text-gray-500">
              Default Ellaria: 6 detik.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-400">
              Harga 1 Chapter Premium
            </label>

            <input
              type="number"
              min="0"
              value={coinPrice}
              onChange={event =>
                setCoinPrice(event.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-[#42A5F5]"
            />

            <p className="mt-1 text-xs text-gray-500">
              Nilai coin dapat diubah admin.
            </p>
          </div>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="rounded-xl bg-[#42A5F5] px-6 py-3 font-semibold text-black disabled:opacity-50"
          >
            {saving
              ? 'Menyimpan...'
              : 'Simpan Pengaturan'}
          </button>

        </div>

      </div>
    </main>
  )
}
