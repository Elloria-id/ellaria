import { prisma } from '@/lib/db/prisma'
import { Banner } from '@/components/home/Banner'
import { ContinueReading } from '@/components/home/ContinueReading'
import { Trending } from '@/components/home/Trending'
import { LatestRelease } from '@/components/home/LatestRelease'
import { GenreSection } from '@/components/home/GenreSection'
import { Announcement } from '@/components/home/Announcement'

export default async function HomePage() {
  const [banners, announcements] = await Promise.all([
    prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    }),
    prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 1,
    }),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Announcement */}
      {announcements.length > 0 && (
        <Announcement content={announcements[0].content} />
      )}

      {/* Banner */}
      <div className="mb-8">
        <Banner banners={banners} />
      </div>

      {/* Continue Reading */}
      <ContinueReading />

      {/* Trending */}
      <Trending />

      {/* Latest Release */}
      <LatestRelease />

      {/* Genres */}
      <GenreSection />

      {/* Join Community CTA */}
      <div className="mt-12 glass-card p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Bergabunglah dengan Komunitas ELLARIA</h2>
        <p className="text-gray-400 mb-6">
          Diskusikan series favorit Anda, berbagi rekomendasi, dan berteman dengan sesama pembaca.
        </p>
        <a href="/community" className="btn-primary inline-block">
          Jelajahi Komunitas
        </a>
      </div>
    </div>
  )
}
