import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    const progress =
      await prisma.readingProgress.findMany({
        where: {
          userId: session.user.id,
        },

        include: {
          series: {
            select: {
              id: true,
              title: true,
              slug: true,
              cover: true,
              type: true,
              status: true,
              label: true,
            },
          },

          chapter: {
            select: {
              id: true,
              chapterNumber: true,
              title: true,
              contentType: true,
              isPremium: true,
            },
          },
        },

        orderBy: {
          lastReadAt: 'desc',
        },

        take: 10,
      })

    return NextResponse.json({
      success: true,
      data: progress,
    })
  } catch (error) {
    console.error('CONTINUE_READING_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil continue reading',
      },
      { status: 500 }
    )
  }
}
