import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  UserPlus,
  Users,
  Star,
} from 'lucide-react'

import { prisma } from '@/lib/db/prisma'

type Props = {
  params: Promise<{
    username: string
  }>
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params

  const decodedUsername = decodeURIComponent(username)

  const user = await prisma.user.findUnique({
    where: {
      username: decodedUsername,
    },
    select: {
      id: true,
      username: true,
      avatar: true,
      bio: true,
      role: true,
      exp: true,
      level: true,
      followersCount: true,
      followingCount: true,
      createdAt: true,

      creatorProfile: {
  select: {
    id: true,
    displayName: true,
    bio: true,
  },
},

translatorProfile: {
  select: {
    displayName: true,
    bio: true,
    languages: true,
  },
},
    },
  })

  if (!user) {
    notFound()
  }

  /*
   * Ambil karya milik user.
   *
   * Bisa berasal dari:
   * 1. ownerId
   * 2. creatorId melalui CreatorProfile
   */
  const series = await prisma.series.findMany({
    where: {
      published: true,
      OR: [
        {
          ownerId: user.id,
        },
        ...(user.creatorProfile
          ? [
              {
                creatorId: user.creatorProfile.id,
              },
            ]
          : []),
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      cover: true,
      type: true,
      status: true,
      rating: true,
      views: true,
      readingCount: true,
      is18Plus: true,
      isPremium: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 12,
  })

  const displayName =
    user.creatorProfile?.displayName ||
    user.translatorProfile?.displayName ||
    user.username

  const profileBio =
    user.creatorProfile?.bio ||
    user.translatorProfile?.bio ||
    user.bio

  const initial = user.username.charAt(0).toUpperCase()

  const joinedDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(user.createdAt)

  const roleLabel =
    user.role === 'FOUNDER'
      ? 'Founder'
      : user.role === 'ADMIN'
        ? 'Admin'
        : user.role === 'MODERATOR'
          ? 'Moderator'
          : user.role === 'CREATOR'
            ? 'Creator'
            : user.role === 'TRANSLATOR'
              ? 'Translator'
              : 'Reader'

  const expProgress = Math.min(user.exp % 1000 / 10, 100)

  return (
    <main className="min-h-screen bg-[#05070a] px-4 pb-12 pt-6 text-white md:px-6">
      <div className="mx-auto max-w-5xl">

        {/* BACK */}
        <Link
          href="/search"
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        {/* PROFILE CARD */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1016] shadow-2xl">

          {/* COVER */}
          <div className="relative h-32 overflow-hidden bg-gradient-to-r from-[#42A5F5]/40 via-[#42A5F5]/10 to-[#0b1016] md:h-40">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(66,165,245,0.28),transparent_35%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(66,165,245,0.15),transparent_30%)]" />
          </div>

          <div className="px-5 pb-7 md:px-8">

            {/* AVATAR + ACTION */}
            <div className="-mt-12 flex items-end justify-between md:-mt-14">

              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="h-24 w-24 rounded-full border-4 border-[#0b1016] bg-[#111820] object-cover md:h-28 md:w-28"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#0b1016] bg-[#111820] text-3xl font-bold text-[#42A5F5] md:h-28 md:w-28 md:text-4xl">
                  {initial}
                </div>
              )}

              <div className="mb-1 hidden md:block">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#42A5F5]/30 bg-[#42A5F5]/10 px-4 py-2.5 text-sm font-semibold text-[#42A5F5] transition hover:bg-[#42A5F5]/20"
                >
                  <UserPlus className="h-4 w-4" />
                  Follow
                </Link>
              </div>
            </div>

            {/* USER INFO */}
            <div className="mt-5">

              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold md:text-3xl">
                  {displayName}
                </h1>

                {user.role !== 'USER' && (
                  <span className="rounded-lg border border-[#42A5F5]/20 bg-[#42A5F5]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#42A5F5]">
                    {roleLabel}
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-white/40">
                @{user.username}
              </p>

              {profileBio ? (
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">
                  {profileBio}
                </p>
              ) : (
                <p className="mt-4 text-sm text-white/35">
                  Belum ada bio.
                </p>
              )}

              {/* MOBILE FOLLOW */}
              <div className="mt-5 md:hidden">
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#42A5F5]/30 bg-[#42A5F5]/10 px-4 py-3 text-sm font-semibold text-[#42A5F5] transition hover:bg-[#42A5F5]/20"
                >
                  <UserPlus className="h-4 w-4" />
                  Follow
                </Link>
              </div>

              {/* META */}
              <div className="mt-5 flex flex-wrap gap-4 text-xs text-white/40">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Bergabung {joinedDate}
                </span>

                {user.translatorProfile?.languages &&
                  user.translatorProfile.languages.length > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      {user.translatorProfile.languages.join(', ')}
                    </span>
                  )}
              </div>
            </div>

            {/* STATS */}
            <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">

              <StatCard
                label="Level"
                value={user.level.toString()}
              />

              <StatCard
                label="EXP"
                value={user.exp.toLocaleString('id-ID')}
              />

              <StatCard
                label="Following"
                value={user.followingCount.toLocaleString('id-ID')}
              />

              <StatCard
                label="Followers"
                value={user.followersCount.toLocaleString('id-ID')}
              />

            </div>

            {/* EXP BAR */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white/40">
                  Level {user.level}
                </span>

                <span className="text-xs font-semibold text-[#42A5F5]">
                  {user.exp.toLocaleString('id-ID')} EXP
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#42A5F5] transition-all"
                  style={{
                    width: `${expProgress}%`,
                  }}
                />
              </div>
            </div>

          </div>
        </section>

        {/* WORKS */}
        <section className="mt-8">

          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#42A5F5]">
                Library
              </p>

              <h2 className="mt-1 text-xl font-bold md:text-2xl">
                Karya {displayName}
              </h2>
            </div>

            <span className="text-xs text-white/35">
              {series.length} karya
            </span>
          </div>

          {series.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0b1016] px-5 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                <BookOpen className="h-5 w-5 text-white/30" />
              </div>

              <h3 className="mt-4 font-semibold text-white/80">
                Belum ada karya
              </h3>

              <p className="mt-1 text-sm text-white/35">
                User ini belum memiliki karya yang dipublikasikan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">

              {series.map((item) => (
                <Link
                  key={item.id}
                  href={`/series/${item.slug}`}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0b1016] transition hover:-translate-y-1 hover:border-[#42A5F5]/30 hover:bg-[#0e151d]"
                >
                  {/* COVER */}
                  <div className="relative aspect-[16/9] overflow-hidden bg-[#111820]">

                    {item.cover ? (
                      <img
                        src={item.cover}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <BookOpen className="h-7 w-7 text-white/20" />
                      </div>
                    )}

                    {/* TYPE */}
                    <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-[9px] font-semibold uppercase text-white/80 backdrop-blur-sm">
                      {item.type}
                    </span>

                    {item.is18Plus && (
                      <span className="absolute right-2 top-2 rounded-md bg-red-500/90 px-2 py-1 text-[9px] font-bold text-white">
                        18+
                      </span>
                    )}

                    {item.isPremium && (
                      <span className="absolute bottom-2 right-2 rounded-md bg-yellow-400/90 px-2 py-1 text-[9px] font-bold text-black">
                        PREMIUM
                      </span>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="p-3">

                    <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-white/90 group-hover:text-[#42A5F5]">
                      {item.title}
                    </h3>

                    <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-white/35">

                      <span>
                        {item.status}
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-yellow-400" />
                        {item.rating.toFixed(1)}
                      </span>

                    </div>

                    <div className="mt-2 flex items-center gap-3 text-[10px] text-white/30">
                      <span>
                        {item.views.toLocaleString('id-ID')} views
                      </span>

                      <span>
                        {item.readingCount.toLocaleString('id-ID')} reads
                      </span>
                    </div>

                  </div>
                </Link>
              ))}

            </div>
          )}

        </section>

        {/* FOOTER SPACE */}
        <div className="h-8" />

      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1016] p-4">
      <div className="flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-white/25" />
        <p className="text-xs text-white/40">
          {label}
        </p>
      </div>

      <p className="mt-2 text-xl font-bold text-white">
        {value}
      </p>
    </div>
  )
}
