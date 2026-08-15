import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admin and founder
    if (!['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const now = new Date()
    const today = new Date(now.setHours(0, 0, 0, 0))
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalUsers,
      activeUsers,
      totalSeries,
      totalChapters,
      totalViews,
      totalRevenue,
      popularSeries,
      popularGenres,
      dailyActive,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { lastActiveAt: { gte: weekAgo } },
      }),
      prisma.series.count({ where: { published: true } }),
      prisma.chapter.count({ where: { isPublished: true } }),
      prisma.series.aggregate({
        _sum: { views: true },
      }),
      // Revenue from coin purchases (simplified)
      prisma.coinTransaction.aggregate({
        where: {
          type: 'PURCHASE',
          createdAt: { gte: monthAgo },
        },
        _sum: { amount: true },
      }),
      // Popular series
      prisma.series.findMany({
        where: { published: true },
        orderBy: { views: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          views: true,
          cover: true,
        },
      }),
      // Popular genres
      prisma.genre.findMany({
        take: 10,
        orderBy: {
          series: {
            _count: 'desc',
          },
        },
        include: {
          _count: {
            select: { series: true },
          },
        },
      }),
      // Daily active users (last 7 days)
      prisma.readingHistory.groupBy({
        by: ['lastReadAt'],
        where: {
          lastReadAt: { gte: weekAgo },
        },
        _count: {
          userId: true,
        },
        orderBy: { lastReadAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          totalSeries,
          totalChapters,
          totalViews: totalViews._sum.views || 0,
          totalRevenue: Math.abs(totalRevenue._sum.amount || 0),
        },
        popularSeries,
        popularGenres,
        dailyActive,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
