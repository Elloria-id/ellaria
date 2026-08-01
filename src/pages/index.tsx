import Head from 'next/head'
import AnnouncementBar from '@/components/AnnouncementBar'
import Header from '@/components/Header'
import BannerSlider from '@/components/BannerSlider'

export default function Home() {
  return (
    <>
      <Head>
        <title>Ellaria</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AnnouncementBar />
      <Header />
      <main className="max-w-5xl mx-auto p-4">
        <BannerSlider />
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Trending</h2>
          <div className="mt-3">{/* TrendingCarousel placeholder */}</div>
        </section>
      </main>
    </>
  )
}
