import { prisma } from '@/lib/db/prisma'
import { notFound } from 'next/navigation'
import { Bookmark, Clock, Eye, Star, Lock, ChevronRight } from 'lucide-react'

interface SeriesPageProps {
  params: { slug: string }
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const series = await prisma.series.findUnique({
    where: { slug: params.slug, published: true },
    include: {
      genres: { include: { genre: true } },
      chapters: {
        where: { isPublished: true },
        orderBy: { chapterNumber: 'desc' },
        include: {
          images: { take: 1 },
        },
      },
      _count: {
        select: { chapters: true, bookmarks: true },
      },
    },
  })

  if (!series) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cover */}
        <div className="md:col-span-1">
          <div className="sticky top-20">
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
              <img
                src={series.cover || '/images/placeholder-cover.jpg'}
                alt={series.title}
                className="w-full h-full object-cover"
              />
              {series.isPremium && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-primary/80 text-white text-sm rounded">
                  Premium
                </div>
              )}
              {series.is18Plus && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-red-500/80 text-white text-sm rounded">
                  18+
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              <button className="w-full btn-primary">
                Mulai Membaca
              </button>
              <button className="w-full btn-secondary">
                <Bookmark className="w-4 h-4 mr-2 inline" />
                Bookmark
              </button>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{series.title}</h1>
            {series.alternativeTitle && (
              <p className="text-gray-400 mt-1">{series.alternativeTitle}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {series.genres.map((sg) => (
                <span
                  key={sg.genreId}
                  className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full"
                >
                  {sg.genre.name}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-gray-400">
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {series.views.toLocaleString()} views
            </div>
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-1 text-yellow-400" />
              {series.rating.toFixed(1)}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {series.status}
            </div>
            <div className="flex items-center">
              {series._count.chapters} chapters
            </div>
            <div className="flex items-center">
              {series._count.bookmarks} bookmarks
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium mb-2">Deskripsi</h2>
            <p className="text-gray-300 leading-relaxed">
              {series.description || 'Tidak ada deskripsi.'}
            </p>
            {series.author && (
              <p className="text-sm text-gray-400 mt-2">Author: {series.author}</p>
            )}
            {series.artist && (
              <p className="text-sm text-gray-400 mt-1">Artist: {series.artist}</p>
            )}
          </div>

          {/* Chapters */}
          <div>
            <h2 className="text-lg font-medium mb-4">Daftar Chapter</h2>
            <div className="space-y-2">
              {series.chapters.map((chapter) => (
                <a
                  key={chapter.id}
                  href={`/reader/${series.slug}/${chapter.id}`}
                  className="flex items-center justify-between p-4 glass-card hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">
                      Chapter {chapter.chapterNumber}
                    </span>
                    {chapter.title && (
                      <span className="text-sm text-gray-400">
                        {chapter.title}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {chapter.isPremium && (
                      <Lock className="w-4 h-4 text-primary" />
                    )}
                    <span className="text-sm text-gray-400">
                      {chapter.views} views
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
