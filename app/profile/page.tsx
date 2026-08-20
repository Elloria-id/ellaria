import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      username: true,
      email: true,
      avatar: true,
      bio: true,
      role: true,
      coins: true,
      exp: true,
      level: true,
      followersCount: true,
      followingCount: true,
      createdAt: true,
    },
  })

  if (!user) {
    redirect('/login')
  }

  const initial = user.username.charAt(0).toUpperCase()

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1016]">

          <div className="h-32 bg-gradient-to-r from-[#42A5F5] to-[#0b1016]" />

          <div className="px-6 pb-8">

            <div className="-mt-12 mb-6 flex items-end justify-between">

              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="h-24 w-24 rounded-full border-4 border-[#0b1016] object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#0b1016] bg-[#111820] text-3xl font-bold text-[#42A5F5]">
                  {initial}
                </div>
              )}

              <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10">
                Edit Profile
              </button>

            </div>

            <div>
              <h1 className="text-2xl font-bold">
                {user.username}
              </h1>

              <p className="mt-1 text-sm text-white/50">
                @{user.username}
              </p>

              <p className="mt-2 text-xs uppercase tracking-wider text-[#42A5F5]">
                {user.role}
              </p>
            </div>

            <p className="mt-5 text-sm leading-6 text-white/70">
              {user.bio || 'Belum ada bio.'}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Coin
                </p>
                <p className="mt-1 text-xl font-bold">
                  {user.coins}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Level
                </p>
                <p className="mt-1 text-xl font-bold">
                  {user.level}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Following
                </p>
                <p className="mt-1 text-xl font-bold">
                  {user.followingCount}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Followers
                </p>
                <p className="mt-1 text-xl font-bold">
                  {user.followersCount}
                </p>
              </div>

            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/50">
                  EXP
                </span>

                <span className="text-sm font-semibold">
                  {user.exp} EXP
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#42A5F5]"
                  style={{
                    width: `${Math.min(user.exp % 1000 / 10, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-2">

              <a
                href="/bookmark"
                className="rounded-xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
              >
                <h2 className="font-semibold">
                  Bookmark
                </h2>

                <p className="mt-1 text-sm text-white/50">
                  Lihat komik yang kamu simpan.
                </p>
              </a>

              <a
                href="/history"
                className="rounded-xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
              >
                <h2 className="font-semibold">
                  Riwayat Membaca
                </h2>

                <p className="mt-1 text-sm text-white/50">
                  Lanjutkan komik yang terakhir kamu baca.
                </p>
              </a>

            </div>

          </div>
        </div>

      </div>
    </main>
  )
}
