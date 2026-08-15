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

    if (!['TRANSLATOR', 'ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    // Untuk translator: series yang mereka terjemahkan
    // Untuk admin: semua series
    const where: any = {}
    if (session.user.role === 'TRANSLATOR') {
      where.ownerId = session.user.id
    }

    const series = await prisma.series.findMany({
      where,
      include: {
        chapters: {
          where: { isPublished: true },
          orderBy: { chapterNumber: 'desc' },
        },
        _count: {
          select: { chapters: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: series,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
