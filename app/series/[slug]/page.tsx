import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import type { SeriesStatus, SeriesType } from '@prisma/client'
import {
  Bookmark,
  BookOpen,
  ChevronRight,
  Eye,
  Lock,
  Play,
  Star,
} from 'lucide-react'

type SeriesPageProps = {
  params: {
    slug: string
  }
}

function getStatusLabel(status: SeriesStatus) {
  switch (status) {
    case 'ONGOING':
      return 'Ongoing'
    case 'COMPLETED':
      return 'Completed'
    case 'HIATUS':
      return 'Hiatus'
    default:
      return status
  }
}

function getTypeLabel(type: SeriesType) {
  switch (type) {
    case 'MANGA':
      return 'Manga'
    case 'MANHWA':
      return 'Manhwa'
    case 'MANHUA':
      return 'Manhua'
    case 'NOVEL':
      return 'Novel'
    case 'ONE_SHOT':
      return 'One Shot'
    default:
      return type
  }
}

function formatNumber(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }

  return String(value)
}

export default async function SeriesPage({
  params,
}: SeriesPageProps) {
  const series = await prisma.series.findUnique({
    where: {
      slug: params.slug,
      published: true,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      alternativeTitle: true,
      description: true,
      cover: true,
      author: true,
      artist: true,
      status: true,
      type: true,
      rating: true,
      views: true,
      is18Plus: true,
      isPremium: true,

      genres: {
        select: {
          genre: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },

      chapters: {
        where: {
          isPublished: true,
        },
        orderBy: {
          chapterNumber: 'desc',
        },
        select: {
          id: true,
          chapterNumber: true,
          title: true,
          isPremium: true,
          views: true,
        },
      },

      _count: {
        select: {
          chapters: true,
          bookmarks: true,
        },
      },
    },
  })

  if (!series) {
    notFound()
  }

  const hasChapters = series.chapters.length > 0

  /*
   * Chapter diurutkan terbaru -> terlama untuk ditampilkan.
   * Chapter paling akhir di array (chapterNumber terkecil) adalah
   * titik awal yang paling sesuai untuk tombol "Mulai Membaca".
   */
  const firstChapter = hasChapters
    ? series.chapters[series.chapters.length - 1]
    : null

  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {/* COVER & ACTIONS */}
          <div className="md:col-span-1">
            <div className="md:sticky md:top-20">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111820]">
                <img
                  src={series.cover || '/images/placeholder-cover.jpg'}
                  alt={series.title}
                  className="h-full w-full object-cover"
                />

                {series.isPremium && (
                  <span className="absolute right-2 top-2 rounded-md bg-amber-400/90 px-2 py-1 text-[10px] font-semibold text-black">
                    Premium
                  </span>
                )}

                {series.is18Plus && (
                  <span className="absolute left-2 top-2 rounded-md bg-red-500/90 px-2 py-1 text-[10px] font-semibold text-white">
                    18+
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2.5">
                {firstChapter ? (
                  <Link
                    href={`/series/${series.slug}/${firstChapter.id}`}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#42A5F5] text-sm font-semibold text-black transition hover:bg-[#42A5F5]/90"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Mulai Membaca
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-white/30"
                  >
                    Belum Ada Chapter
                  </button>
                )}

                {/* TODO: hubungkan ke API bookmark saat sudah tersedia */}
                <button
                  type="button"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <Bookmark className="h-4 w-4" />
                  Bookmark
                </button>
              </div>
            </div>
          </div>

          {/* DETAILS */}
          <div className="min-w-0 space-y-6 md:col-span-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {series.title}
              </h1>

              {series.alternativeTitle && (
                <p className="mt-1 text-sm text-white/40">
                  {series.alternativeTitle}
                </p>
              )}

              {series.genres.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {series.genres.map(({ genre }) => (
                    <Link
                      key={genre.id}
                      href={`/search?type=series&genre=${genre.slug}`}
                      className="rounded-full bg-[#42A5F5]/10 px-3 py-1 text-xs font-medium text-[#42A5F5] transition hover:bg-[#42A5F5]/20"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* META */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/40 sm:text-sm">
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {formatNumber(series.views)} views
              </span>

              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-current text-amber-400/80" />
                {series.rating.toFixed(1)}
              </span>

              <span className="rounded-md bg-white/[0.05] px-2 py-1 text-white/50">
                {getStatusLabel(series.status)}
              </span>

              <span className="rounded-md bg-white/[0.05] px-2 py-1 text-white/50">
                {getTypeLabel(series.type)}
              </span>

              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {series._count.chapters} chapter
              </span>

              <span className="flex items-center gap-1.5">
                <Bookmark className="h-4 w-4" />
                {series._count.bookmarks} bookmark
              </span>
            </div>

            {/* DESCRIPTION */}
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/50">
                Sinopsis
              </h2>

              <p className="whitespace-pre-line text-sm leading-6 text-white/60">
                {series.description || 'Tidak ada deskripsi.'}
              </p>

              {series.author && (
                <p className="mt-3 text-sm text-white/40">
                  Author: <span className="text-white/60">{series.author}</span>
                </p>
              )}

              {series.artist && (
                <p className="mt-1 text-sm text-white/40">
                  Artist: <span className="text-white/60">{series.artist}</span>
                </p>
              )}
            </div>

            {/* CHAPTERS */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-6 w-1 rounded-full bg-[#42A5F5]" />

                <h2 className="text-lg font-bold text-white">
                  Daftar Chapter
                </h2>

                <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-xs text-white/35">
                  {series._count.chapters}
                </span>
              </div>

              {hasChapters ? (
                <div className="space-y-2">
                  {series.chapters.map((chapter) => (
                    <Link
                      key={chapter.id}
                      href={`/series/${series.slug}/${chapter.id}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#090f18] p-3.5 transition hover:border-[#42A5F5]/25 hover:bg-[#0b121d] sm:p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="shrink-0 text-sm font-medium text-white">
                          Chapter {chapter.chapterNumber}
                        </span>

                        {chapter.title && (
                          <span className="truncate text-sm text-white/40">
                            {chapter.title}
                          </span>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        {chapter.isPremium && (
                          <Lock className="h-3.5 w-3.5 text-[#42A5F5]" />
                        )}

                        <span className="text-xs text-white/35">
                          {formatNumber(chapter.views)} views
                        </span>

                        <ChevronRight className="h-4 w-4 text-white/25" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.08] bg-[#090f18]/70 px-5 py-12 text-center">
                  <p className="text-sm text-white/40">
                    Belum ada chapter yang dipublikasikan.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
