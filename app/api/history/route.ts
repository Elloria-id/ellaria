import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url)

    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get('limit') || 20))
    )

    const history = await prisma.readingHistory.findMany({
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
          },
        },
      },

      orderBy: {
        lastReadAt: 'desc',
      },

      take: limit,
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
        message: 'Gagal mengambil riwayat baca',
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
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    const body = await req.json()

    if (!body.seriesId || !body.chapterId) {
      return NextResponse.json(
        {
          success: false,
          message: 'seriesId dan chapterId diperlukan',
        },
        { status: 400 }
      )
    }

    const chapter = await prisma.chapter.findUnique({
      where: {
        id: body.chapterId,
      },
      select: {
        id: true,
        seriesId: true,
      },
    })

    if (!chapter || chapter.seriesId !== body.seriesId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Chapter tidak valid',
        },
        { status: 400 }
      )
    }

    const progress =
      typeof body.progress === 'number'
        ? Math.max(0, Math.min(100, body.progress))
        : 0

    const history = await prisma.readingHistory.create({
      data: {
        userId: session.user.id,
        seriesId: body.seriesId,
        chapterId: body.chapterId,
        progress,
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

export async function DELETE(req: Request) {
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

    const { searchParams } = new URL(req.url)
    const historyId = searchParams.get('id')

    if (historyId) {
      await prisma.readingHistory.deleteMany({
        where: {
          id: historyId,
          userId: session.user.id,
        },
      })
    } else {
      await prisma.readingHistory.deleteMany({
        where: {
          userId: session.user.id,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Riwayat berhasil dihapus',
    })
  } catch (error) {
    console.error('HISTORY_DELETE_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menghapus riwayat',
      },
      { status: 500 }
    )
  }
}
