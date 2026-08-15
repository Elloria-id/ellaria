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

    if (!['CREATOR', 'ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const [seriesCount, chapterCount, totalViews, totalBookmarks] = await Promise.all([
      prisma.series.count({ where: { ownerId: session.user.id } }),
      prisma.chapter.count({
        where: { series: { ownerId: session.user.id } },
      }),
      prisma.series.aggregate({
        where: { ownerId: session.user.id },
        _sum: { views: true },
      }),
      prisma.bookmark.count({
        where: { series: { ownerId: session.user.id } },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        seriesCount,
        chapterCount,
        totalViews: totalViews._sum.views || 0,
        totalBookmarks,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
