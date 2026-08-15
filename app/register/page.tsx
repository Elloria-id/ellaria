'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Terjadi kesalahan')
        setLoading(false)
        return
      }

      router.push('/login?registered=true')
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4">
      <div className="max-w-md w-full glass-card p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-cinzel text-gradient font-bold">
            ELLARIA
          </h1>
          <p className="text-gray-400 mt-2">Buat akun baru</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-dark-400/50 border border-glass-border rounded-lg p-3 focus:outline-none focus:border-primary"
              required
              minLength={3}
              maxLength={30}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dark-400/50 border border-glass-border rounded-lg p-3 focus:outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark-400/50 border border-glass-border rounded-lg p-3 focus:outline-none focus:border-primary"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Memuat...' : 'Daftar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Masuk
          </Link>
        </div>
      </div>
    </div>
  )
}
