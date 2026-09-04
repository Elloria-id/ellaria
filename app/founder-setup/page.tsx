"use client"

import React, { useState } from 'react'

// TODO: This temporary founder bootstrap page MUST be removed after the first Founder account is created.
//       Do NOT leave this page in production longer than necessary.

export const dynamic = 'force-dynamic'

export default function FounderSetupPage() {
  const [email, setEmail] = useState('')
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const res = await fetch('/api/founder-bootstrap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, key }),
        cache: 'no-store',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data?.message || 'Gagal melakukan request')
      } else {
        setMessage(data?.message || 'Selesai')
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#05070a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0b0f13] rounded-lg border border-gray-800 p-6">
        <h1 className="text-2xl font-semibold mb-4">Founder Setup (Temporary)</h1>

        <p className="text-sm text-gray-300 mb-4">Halaman sementara untuk mengaktifkan akun Founder pertama. Hanya gunakan sekali lalu hapus file ini (see TODO comment).</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email (sudah terdaftar)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded bg-[#0b1220] border border-gray-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Founder Bootstrap Key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
              className="w-full px-3 py-2 rounded bg-[#0b1220] border border-gray-700 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 rounded disabled:opacity-50"
            >
              {loading ? 'Mengaktifkan...' : 'Aktifkan Founder'}
            </button>
          </div>

          {message && <div className="text-green-400 text-sm">{message}</div>}
          {error && <div className="text-red-400 text-sm">{error}</div>}
        </form>

        <hr className="my-4 border-gray-800" />
        <p className="text-xs text-gray-500">Catatan keamanan: pastikan FOUNDER_BOOTSTRAP_KEY disimpan di environment (Vercel Environment Variables) dan jangan commit kunci ke repo.</p>
      </div>
    </main>
  )
}
