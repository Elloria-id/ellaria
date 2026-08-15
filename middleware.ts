import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { Role } from '@prisma/client'

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname
    const token = req.nextauth.token

    // Public routes
    const publicRoutes = [
      '/',
      '/login',
      '/register',
      '/search',
      '/series',
      '/api/auth',
      '/api/public',
      '/api/cron',
    ]

    if (publicRoutes.some(route => path.startsWith(route))) {
      return NextResponse.next()
    }

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Admin routes
    if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
      const allowedRoles = [Role.ADMIN, Role.FOUNDER]
      if (!allowedRoles.includes(token.role as Role)) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    // Creator routes
    if (path.startsWith('/creator') || path.startsWith('/api/creator')) {
      const allowedRoles = [Role.CREATOR, Role.ADMIN, Role.FOUNDER]
      if (!allowedRoles.includes(token.role as Role)) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    // Translator routes
    if (path.startsWith('/translator') || path.startsWith('/api/translator')) {
      const allowedRoles = [Role.TRANSLATOR, Role.ADMIN, Role.FOUNDER]
      if (!allowedRoles.includes(token.role as Role)) {
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
