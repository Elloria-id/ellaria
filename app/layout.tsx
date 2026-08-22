import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { Navbar } from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { BottomNav } from '@/components/layout/BottomNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ELLARIA エル - Manga, Manhwa, Manhua, Novel Platform',
  description: 'Read Manga, Manhwa, Manhua, Novels and One Shot at ELLARIA エル',
  keywords: 'manga, manhwa, manhua, novel, reading, platform, community',
  authors: [{ name: 'Ellaria' }],
  openGraph: {
    title: 'ELLARIA エル',
    description: 'Your premium reading platform for Manga, Manhwa, Manhua, and Novels',
    url: 'https://ellaria.vercel.app',
    siteName: 'ELLARIA エル',
    images: [{ url: '/og-image.jpg' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ELLARIA エル',
    description: 'Your premium reading platform',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} bg-dark-500 text-white min-h-screen`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar hideOnHome />
               <main className="flex-1 pb-16 md:pb-0">
              {children}
            </main>
            <Footer />
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  )
}
