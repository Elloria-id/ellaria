import { prisma } from '@/lib/db/prisma'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { MangaReader } from '@/components/reader/MangaReader'
import { NovelReader } from '@/components/reader/NovelReader'

interface ReaderPageProps {
  params: { slug: string; chapterId: string }
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const session = await getServerSession(authOptions)
  const { slug, chapterId } = params

  // Get series first
  const series = await prisma.series.findUnique({
    where: { slug },
    select: { id: true, title: true, slug: true },
  })

  if (!series) {
    notFound()
  }

  // Get chapter
  const chapter = await prisma.chapter.findFirst({
    where: {
      id: chapterId,
      seriesId: series.id,
      isPublished: true,
    },
    include: {
      images: {
        orderBy: { pageNumber: 'asc' },
      },
      series: true,
    },
  })

  if (!chapter) {
    notFound()
  }

  // Check access
  let hasAccess = true
  let requiresPayment = false

  if (chapter.isPremium || chapter.isLocked) {
    if (!session) {
      redirect(`/login?redirect=/reader/${slug}/${chapterId}`)
    }

    const entitlement = await prisma.chapterEntitlement.findUnique({
      where: {
        userId_chapterId: {
          userId: session.user.id,
          chapterId: chapter.id,
        },
      },
    })

    const vip = await prisma.userVIP.findFirst({
      where: {
        userId: session.user.id,
        expiresAt: { gt: new Date() },
      },
    })

    hasAccess = !!entitlement || !!vip
    requiresPayment = !hasAccess
  }

  // Get next/prev chapters
  const [nextChapter, prevChapter] = await Promise.all([
    prisma.chapter.findFirst({
      where: {
        seriesId: series.id,
        chapterNumber: { gt: chapter.chapterNumber },
        isPublished: true,
      },
      orderBy: { chapterNumber: 'asc' },
      select: { id: true, chapterNumber: true },
    }),
    prisma.chapter.findFirst({
      where: {
        seriesId: series.id,
        chapterNumber: { lt: chapter.chapterNumber },
        isPublished: true,
      },
      orderBy: { chapterNumber: 'desc' },
      select: { id: true, chapterNumber: true },
    }),
  ])

  // If requires payment, show unlock UI
  if (requiresPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-500">
        <div className="max-w-md glass-card p-8 text-center">
          <Lock className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Chapter Terkunci</h2>
          <p className="text-gray-400 mb-4">
            Chapter ini membutuhkan {chapter.coinPrice} koin untuk dibuka.
          </p>
          <div className="flex flex-col space-y-3">
            <button className="btn-primary" onClick={() => {
              // Handle unlock via API
              fetch('/api/chapters/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chapterId: chapter.id }),
              }).then((res) => {
                if (res.ok) {
                  window.location.reload()
                }
              })
            }}>
              Buka dengan {chapter.coinPrice} Koin
            </button>
            <a href={`/series/${slug}`} className="btn-secondary">
              Kembali ke Series
            </a>
          </div>
        </div>
      </div>
    )
  }

  // If no access and no payment option, redirect
  if (!hasAccess) {
    redirect(`/series/${slug}`)
  }

  // Render based on content type
  if (chapter.contentType === 'NOVEL') {
    const contentImage = chapter.images[0]
    let content = ''
    if (contentImage?.url) {
      // Fetch novel content from URL
      const res = await fetch(contentImage.url)
      if (res.ok) {
        content = await res.text()
      }
    }

    return (
      <NovelReader
        chapterId={chapter.id}
        seriesId={series.id}
        content={content || 'Konten novel belum tersedia.'}
        chapter={{
          id: chapter.id,
          chapterNumber: chapter.chapterNumber,
          title: chapter.title || '',
          wordCount: chapter.wordCount || 0,
        }}
        series={{
          id: series.id,
          title: series.title,
          slug: series.slug,
        }}
        nextChapter={nextChapter || undefined}
        prevChapter={prevChapter || undefined}
      />
    )
  }

  // Manga/Manhwa/Manhua reader
  return (
    <MangaReader
      chapterId={chapter.id}
      seriesId={series.id}
      images={chapter.images}
      chapter={{
        id: chapter.id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title || '',
      }}
      series={{
        id: series.id,
        title: series.title,
        slug: series.slug,
      }}
      nextChapter={nextChapter || undefined}
      prevChapter={prevChapter || undefined}
    />
  )
}
