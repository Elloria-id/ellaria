import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ELLARIA エル',
    short_name: 'ELLARIA',
    description: 'Read Manga, Manhwa, Manhua, Novels and One Shot at ELLARIA エル',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a1a',
    theme_color: '#42A5F5',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
