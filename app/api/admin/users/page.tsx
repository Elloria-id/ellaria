'use client'

import { useEffect, useState } from 'react'

type Role =
  | 'USER'
  | 'TRANSLATOR'
  | 'CREATOR'
  | 'MODERATOR'
  | 'ADMIN'
  | 'FOUNDER'

type User = {
  id: string
  username: string
  email: string
  avatar: string | null
  role: Role
  coins: number
  exp: number
  level: number
  isBanned: boolean
  createdAt: string
  _count?: {
    bookmarks: number
    comments: number
    followers: number
    following: number
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState('')

  async function loadUsers() {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()

      if (search.trim()) {
        params.set('search', search.trim())
      }

      if (role) {
        params.set('role', role)
      }

      params.set('page', String(page))
      params.set('limit', '20')

      const response = await fetch(
        `/api/admin/users?${params.toString()}`,
        {
          cache: 'no-store',
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal mengambil data user'
        )
      }

      setUsers(result.data || [])
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
    loadUsers()
  }, [page, role])

  async function updateUser(
    userId: string,
    data: {
      role?: Role
      isBanned?: boolean
    }
  ) {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...data,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal memperbarui user'
        )
      }

      setUsers(current =>
        current.map(user =>
          user.id === userId
            ? {
                ...user,
                ...result.data,
              }
            : user
        )
      )
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Gagal memperbarui user'
      )
    }
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault()
    setPage(1)
    loadUsers()
  }

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Admin Users
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Kelola akun, role, dan status pengguna Ellaria.
          </p>
        </div>

        {/* SEARCH & FILTER */}

        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 md:flex-row"
          >
            <input
              type="text"
              value={search}
              onChange={event =>
                setSearch(event.target.value)
              }
              placeholder="Cari username atau email..."
              className="min-h-[44px] flex-1 rounded-xl border border-white/10 bg-black/30 px-4 text-sm outline-none transition focus:border-[#42A5F5]"
            />

            <select
              value={role}
              onChange={event => {
                setRole(event.target.value)
                setPage(1)
              }}
              className="min-h-[44px] rounded-xl border border-white/10 bg-[#0b1016] px-4 text-sm outline-none focus:border-[#42A5F5]"
            >
              <option value="">Semua Role</option>
              <option value="USER">USER</option>
              <option value="TRANSLATOR">TRANSLATOR</option>
              <option value="CREATOR">CREATOR</option>
              <option value="MODERATOR">MODERATOR</option>
              <option value="ADMIN">ADMIN</option>
              <option value="FOUNDER">FOUNDER</option>
            </select>

            <button
              type="submit"
              className="min-h-[44px] rounded-xl bg-[#42A5F5] px-6 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Cari
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* USER LIST */}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

          {loading ? (
            <div className="p-10 text-center text-sm text-gray-400">
              Memuat data user...
            </div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              Tidak ada user ditemukan.
            </div>
          ) : (
            <div className="divide-y divide-white/10">

              {users.map(user => (
                <div
                  key={user.id}
                  className="p-4 transition hover:bg-white/[0.02]"
                >

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    {/* USER INFO */}

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#42A5F5]/10 text-sm font-bold text-[#42A5F5]">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          user.username
                            .slice(0, 1)
                            .toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">

                          <span className="font-semibold">
                            {user.username}
                          </span>

                          <span className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-gray-400">
                            {user.role}
                          </span>

                          {user.isBanned && (
                            <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400">
                              BANNED
                            </span>
                          )}

                        </div>

                        <p className="truncate text-xs text-gray-500">
                          {user.email}
                        </p>

                        <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-gray-500">
                          <span>
                            Lv. {user.level}
                          </span>

                          <span>
                            {user.coins} Coins
                          </span>

                          <span>
                            {user.exp} EXP
                          </span>

                          <span>
                            {user._count?.followers || 0} Followers
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* ACTIONS */}

                    <div className="flex flex-wrap gap-2">

                      <select
                        value={user.role}
                        disabled={user.role === 'FOUNDER'}
                        onChange={event =>
                          updateUser(user.id, {
                            role: event.target.value as Role,
                          })
                        }
                        className="rounded-lg border border-white/10 bg-[#0b1016] px-3 py-2 text-xs outline-none focus:border-[#42A5F5] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="USER">
                          USER
                        </option>

                        <option value="TRANSLATOR">
                          TRANSLATOR
                        </option>

                        <option value="CREATOR">
                          CREATOR
                        </option>

                        <option value="MODERATOR">
                          MODERATOR
                        </option>

                        <option value="ADMIN">
                          ADMIN
                        </option>

                        <option value="FOUNDER">
                          FOUNDER
                        </option>
                      </select>

                      <button
                        type="button"
                        disabled={user.role === 'FOUNDER'}
                        onClick={() =>
                          updateUser(user.id, {
                            isBanned: !user.isBanned,
                          })
                        }
                        className={`rounded-lg px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          user.isBanned
                            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                            : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        }`}
                      >
                        {user.isBanned
                          ? 'Unban'
                          : 'Ban'}
                      </button>

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
              setPage(current => Math.max(current - 1, 1))
            }
            className="rounded-lg border border-white/10 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-30"
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
            className="rounded-lg border border-white/10 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-30"
          >
            Berikutnya
          </button>

        </div>

      </div>
    </main>
  )
}
