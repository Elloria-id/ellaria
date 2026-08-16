import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname
    const token = req.nextauth.token

    if (!token) {
      return NextResponse.redirect(
        new URL('/login', req.url)
      )
    }

    const role = token.role as string

    if (
      path.startsWith('/admin') ||
      path.startsWith('/api/admin')
    ) {
      if (role !== 'ADMIN' && role !== 'FOUNDER') {
        return NextResponse.redirect(
          new URL('/', req.url)
        )
      }
    }

    if (
      path.startsWith('/creator') ||
      path.startsWith('/api/creator')
    ) {
      if (
        role !== 'CREATOR' &&
        role !== 'ADMIN' &&
        role !== 'FOUNDER'
      ) {
        return NextResponse.redirect(
          new URL('/', req.url)
        )
      }
    }

    if (
      path.startsWith('/translator') ||
      path.startsWith('/api/translator')
    ) {
      if (
        role !== 'TRANSLATOR' &&
        role !== 'ADMIN' &&
        role !== 'FOUNDER'
      ) {
        return NextResponse.redirect(
          new URL('/', req.url)
        )
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

    '/bookmark',
    '/api/bookmarks/:path*',

    '/history',
    '/api/history/:path*',

    '/notifications',
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
