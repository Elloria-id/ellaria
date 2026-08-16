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

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        series: {
          include: {
            genres: {
              include: {
                genre: true,
              },
            },
            chapters: {
              where: {
                isPublished: true,
              },
              orderBy: {
                chapterNumber: 'desc',
              },
              take: 1,
              select: {
                id: true,
                chapterNumber: true,
                title: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: bookmarks,
    })
  } catch (error) {
    console.error('BOOKMARK_GET_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil bookmark',
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
    const seriesId = String(body.seriesId || '').trim()

    if (!seriesId) {
      return NextResponse.json(
        {
          success: false,
          message: 'seriesId diperlukan',
        },
        { status: 400 }
      )
    }

    const series = await prisma.series.findUnique({
      where: {
        id: seriesId,
      },
      select: {
        id: true,
        published: true,
      },
    })

    if (!series || !series.published) {
      return NextResponse.json(
        {
          success: false,
          message: 'Series tidak ditemukan',
        },
        { status: 404 }
      )
    }

    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_seriesId: {
          userId: session.user.id,
          seriesId,
        },
      },
    })

    if (existing) {
      await prisma.bookmark.delete({
        where: {
          id: existing.id,
        },
      })

      return NextResponse.json({
        success: true,
        bookmarked: false,
        message: 'Bookmark dihapus',
      })
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: session.user.id,
        seriesId,
      },
    })

    return NextResponse.json({
      success: true,
      bookmarked: true,
      data: bookmark,
      message: 'Series ditambahkan ke bookmark',
    })
  } catch (error) {
    console.error('BOOKMARK_POST_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengubah bookmark',
      },
      { status: 500 }
    )
  }
}
