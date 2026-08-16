import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const history = await prisma.readingHistory.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        lastReadAt: 'desc',
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
          },
        },
      },
      take: 100,
    })

    return NextResponse.json({
      success: true,
      data: history,
    })
  } catch (error) {
    console.error('HISTORY_GET_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil riwayat',
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()

    const seriesId = String(body.seriesId || '')
    const chapterId = String(body.chapterId || '')
    const progress = Number(body.progress || 0)

    if (!seriesId || !chapterId) {
      return NextResponse.json(
        {
          success: false,
          message: 'seriesId dan chapterId diperlukan',
        },
        { status: 400 }
      )
    }

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        seriesId,
        isPublished: true,
      },
    })

    if (!chapter) {
      return NextResponse.json(
        {
          success: false,
          message: 'Chapter tidak ditemukan',
        },
        { status: 404 }
      )
    }

    const safeProgress = Math.max(
      0,
      Math.min(100, progress)
    )

    const history = await prisma.readingHistory.upsert({
      where: {
        id: `${session.user.id}_${seriesId}_${chapterId}`,
      },
      create: {
        id: `${session.user.id}_${seriesId}_${chapterId}`,
        userId: session.user.id,
        seriesId,
        chapterId,
        progress: safeProgress,
      },
      update: {
        progress: safeProgress,
        lastReadAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: history,
    })
  } catch (error) {
    console.error('HISTORY_POST_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menyimpan riwayat',
      },
      { status: 500 }
    )
  }
}
