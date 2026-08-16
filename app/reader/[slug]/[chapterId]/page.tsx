import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import MangaReader from '@/components/reader/MangaReader'
import NovelReader from '@/components/reader/NovelReader'

type PageProps = {
  params: {
    slug: string
    chapterId: string
  }
}

export default async function ReaderPage({
  params,
}: PageProps) {
  const chapter = await prisma.chapter.findFirst({
    where: {
      id: params.chapterId,
      series: {
        slug: params.slug,
      },
    },
    include: {
      series: true,
    },
  })

  if (!chapter) {
    notFound()
  }

  const type = String(chapter.series.type || '').toUpperCase()

  /*
    images/content menyesuaikan field schema final.
    Jika schema menyimpan halaman sebagai JSON,
    API reader berikutnya akan menjadi sumber data
    utamanya.
  */

  const images: string[] = []

  const content = 'content' in chapter
    ? String((chapter as { content?: string }).content || '')
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
      images={images}
      coinPrice={Number((chapter as { coinPrice?: number }).coinPrice || 0)}
    />
  )
}
