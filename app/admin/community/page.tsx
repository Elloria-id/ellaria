'use client'

import { useEffect, useState } from 'react'

type Community = {
  id: string
  name: string
  description: string | null
  type: string
  avatar: string | null
  _count: {
    members: number
    messages: number
  }
}

export default function CommunityPage() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function loadCommunities() {
    try {
      const response = await fetch('/api/community')
      const data = await response.json()

      if (data.success) {
        setCommunities(data.communities)
      } else {
        setMessage(data.message || 'Gagal mengambil komunitas')
      }
    } catch {
      setMessage('Gagal terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  async function joinCommunity(id: string) {
    try {
      const response = await fetch('/api/community/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          communityId: id,
        }),
      })

      const data = await response.json()

      setMessage(data.message || 'Selesai')
    } catch {
      setMessage('Gagal bergabung')
    }
  }

  useEffect(() => {
    loadCommunities()
  }, [])

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-bold">
          Community
        </h1>

        <p className="mb-6 text-sm text-gray-400">
          Bergabung dengan komunitas Ellaria.
        </p>

        {message && (
          <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
            {message}
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">
            Memuat komunitas...
          </p>
        ) : communities.length === 0 ? (
          <div className="rounded-xl border border-white/10 p-6 text-center text-gray-400">
            Belum ada komunitas.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {communities.map(community => (
              <div
                key={community.id}
                className="rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <h2 className="text-lg font-semibold">
                  {community.name}
                </h2>

                <p className="mt-2 text-sm text-gray-400">
                  {community.description ||
                    'Belum ada deskripsi.'}
                </p>

                <div className="mt-4 flex gap-4 text-xs text-gray-500">
                  <span>
                    {community._count.members} anggota
                  </span>

                  <span>
                    {community._count.messages} pesan
                  </span>
                </div>

                <button
                  onClick={() =>
                    joinCommunity(community.id)
                  }
                  className="mt-4 w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  Gabung
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
