import Announcement from '@/components/home/Announcement'
import Banner from '@/components/home/Banner'
import ContinueReading from '@/components/home/ContinueReading'
import Trending from '@/components/home/Trending'
import LatestRelease from '@/components/home/LatestRelease'
import GenreSection from '@/components/home/GenreSection'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

async function getHomeData() {
  try {
    const [banners, series, genres] =
      await Promise.all([
        prisma.banner.findMany({
          where: {
            active: true,
          },
          orderBy: {
            order: 'asc',
          },
          take: 10,
        }),

        prisma.series.findMany({
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        }),

        prisma.genre.findMany({
          orderBy: {
            name: 'asc',
          },
          take: 100,
        }),
      ])

    return {
      banners,
      series,
      genres,
    }
  } catch (error) {
    console.error(
      'HOME DATA ERROR:',
      error
    )

    return {
      banners: [],
      series: [],
      genres: [],
    }
  }
}

export default async function HomePage() {
  const data = await getHomeData()

  const mappedSeries = data.series.map(item => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    cover:
      'cover' in item
        ? String(
            (item as unknown as {
              cover?: string
            }).cover || ''
          )
        : null,
    type: String(
      (item as unknown as {
        type?: string
      }).type || ''
    ),
  }))

  return (
    <main className="min-h-screen bg-[#05070a] text-white">

      <Announcement />

      <Banner
        items={data.banners.map(item => ({
          id: item.id,
          title: item.title,
          image: item.image,
          link: item.link,
        }))}
      />

      <ContinueReading />

      <Trending items={mappedSeries.slice(0, 10)} />

      <LatestRelease
        items={mappedSeries.map(item => ({
          ...item,
          chapter: undefined,
        }))}
      />

      <GenreSection
        genres={data.genres.map(item => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
        }))}
      />

    </main>
  )
}
