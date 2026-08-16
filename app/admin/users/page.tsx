'use client'

import { useEffect, useState } from 'react'

type User = {
  id: string
  username: string
  email: string
  avatar: string | null
  role: string
  coins: number
  exp: number
  level: number
  isBanned: boolean
  followersCount: number
  followingCount: number
  createdAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  async function loadUsers() {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()

      if (search) {
        params.set('search', search)
      }

      const response = await fetch(
        `/api/admin/users?${params.toString()}`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengambil user')
      }

      setUsers(data.users || [])
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
    loadUsers()
  }, [])

  async function updateUser(
    userId: string,
    action: string,
    extra: Record<string, unknown> = {}
  ) {
    const response = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        action,
        ...extra,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      alert(data.message || 'Gagal')
      return
    }

    await loadUsers()
  }

  async function deleteUser(userId: string) {
    const confirmed = window.confirm(
      'Yakin ingin menghapus user ini?'
    )

    if (!confirmed) return

    const response = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      alert(data.message || 'Gagal menghapus user')
      return
    }

    await loadUsers()
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-bold">
          Manajemen User
        </h1>

        <div className="mb-6 flex gap-2">
          <input
            value={search}
            onChange={event =>
              setSearch(event.target.value)
            }
            onKeyDown={event => {
              if (event.key === 'Enter') {
                loadUsers()
              }
            }}
            placeholder="Cari username atau email..."
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 outline-none"
          />

          <button
            onClick={loadUsers}
            className="rounded-lg bg-blue-500 px-5 py-3 font-semibold"
          >
            Cari
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center">
            Memuat user...
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
            Tidak ada user.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[900px]">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left">
                    User
                  </th>
                  <th className="px-4 py-3 text-left">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left">
                    Coin
                  </th>
                  <th className="px-4 py-3 text-left">
                    Level
                  </th>
                  <th className="px-4 py-3 text-left">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map(user => (
                  <tr
                    key={user.id}
                    className="border-t border-white/10"
                  >
                    <td className="px-4 py-4">
                      <div className="font-semibold">
                        {user.username}
                      </div>

                      <div className="text-sm text-white/50">
                        {user.email}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {user.role}
                    </td>

                    <td className="px-4 py-4">
                      {user.coins}
                    </td>

                    <td className="px-4 py-4">
                      {user.level}
                    </td>

                    <td className="px-4 py-4">
                      {user.isBanned
                        ? 'Banned'
                        : 'Active'}
                    </td>

                    <td className="space-x-2 px-4 py-4">
                      {user.role !== 'FOUNDER' && (
                        <>
                          <button
                            onClick={() =>
                              updateUser(
                                user.id,
                                user.isBanned
                                  ? 'UNBAN'
                                  : 'BAN'
                              )
                            }
                            className="rounded bg-white/10 px-3 py-2 text-sm"
                          >
                            {user.isBanned
                              ? 'Unban'
                              : 'Ban'}
                          </button>

                          <button
                            onClick={() =>
                              updateUser(
                                user.id,
                                'COINS',
                                { amount: 10 }
                              )
                            }
                            className="rounded bg-blue-500/20 px-3 py-2 text-sm"
                          >
                            +10 Coin
                          </button>

                          <button
                            onClick={() =>
                              deleteUser(user.id)
                            }
                            className="rounded bg-red-500/20 px-3 py-2 text-sm"
                          >
                            Hapus
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
