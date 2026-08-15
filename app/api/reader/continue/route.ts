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

    const progress = await prisma.readingProgress.findMany({
      where: { userId: session.user.id },
      include: {
        series: {
          include: {
            genres: { include: { genre: true } },
          },
        },
        chapter: true,
      },
      orderBy: { lastReadAt: 'desc' },
      distinct: ['seriesId'],
      take: 10,
    })

    return NextResponse.json({
      success: true,
      data: progress,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
