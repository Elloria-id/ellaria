import { notFound } from 'next/navigation'

import { prisma } from '@/lib/db/prisma'
import MangaReader from '@/components/reader/MangaReader'
import NovelReader from '@/components/reader/NovelReader'
import { getStorageProvider } from '@/lib/storage/provider'
import type { Prisma } from '@prisma/client'

type PageProps = {
  params: Promise<{
    slug: string
    chapterId: string
  }>
}

export default async function ReaderPage({
  params,
}: PageProps) {
  const { slug, chapterId } = await params

  const chapter = await prisma.chapter.findFirst({
    where: {
      id: chapterId,
      series: {
        slug,
      },
    },
    include: {
      series: true,
      images: {
        orderBy: {
          pageNumber: 'asc',
        },
      },
    },
  })

  if (!chapter) {
    notFound()
  }

  const type = String(
    chapter.contentType || chapter.series.type || ''
  ).toUpperCase()

  const images =
    type === 'NOVEL'
      ? []
      : await Promise.all(
          chapter.images.map(
            async (image: Prisma.ChapterImageGetPayload<{}>) => ({
            pageNumber: image.pageNumber,
            url:
              image.url ||
              (await getStorageProvider().getUrl(
                image.storageKey
              )),
            })
          )
        )
  const orderedImages = images
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map(image => image.url)

  /*
   * Novel menggunakan content jika field tersebut tersedia
   * pada model Chapter.
   */
  const content =
    'content' in chapter
      ? String(
          (chapter as { content?: string | null }).content || ''
        )
      : ''

  if (type === 'NOVEL') {
    return (
      <NovelReader
        title={`${chapter.series.title} — Chapter ${chapter.chapterNumber}`}
        content={content}
      />
    )
  }

  return (
    <MangaReader
      chapterId={chapter.id}
      title={`${chapter.series.title} — Chapter ${chapter.chapterNumber}`}
      images={orderedImages}
      coinPrice={Number(
        (chapter as { coinPrice?: number | null }).coinPrice || 0
      )}
    />
  )
}
