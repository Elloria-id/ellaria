import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/search',
  '/series',
  '/api/auth',
  '/api/public',
]

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    if (
      PUBLIC_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
      )
    ) {
      return NextResponse.next()
    }

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const role = String(token.role || 'USER')

    if (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/api/admin')
    ) {
      if (!['ADMIN', 'FOUNDER'].includes(role)) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    if (
      pathname.startsWith('/creator') ||
      pathname.startsWith('/api/creator')
    ) {
      if (!['CREATOR', 'ADMIN', 'FOUNDER'].includes(role)) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    if (
      pathname.startsWith('/translator') ||
      pathname.startsWith('/api/translator')
    ) {
      if (!['TRANSLATOR', 'ADMIN', 'FOUNDER'].includes(role)) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',

    '/creator/:path*',
    '/api/creator/:path*',

    '/translator/:path*',
    '/api/translator/:path*',

    '/bookmark/:path*',
    '/api/bookmarks/:path*',

    '/history/:path*',
    '/api/history/:path*',

    '/notifications/:path*',
    '/api/notifications/:path*',

    '/profile/:path*/edit',

    '/api/reader/:path*',
    '/api/coins/:path*',
    '/api/payments/:path*',
    '/api/vip/:path*',
    '/api/missions/:path*',
    '/api/daily-reward/:path*',
    '/api/follow/:path*',
    '/api/community/:path*',
    '/api/comments/:path*',
    '/api/upload/:path*',
  ],
}
