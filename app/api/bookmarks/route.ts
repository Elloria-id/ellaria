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

    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId: session.user.id,
      },

      include: {
        series: {
          include: {
            genres: {
              include: {
                genre: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
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
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    const body = await req.json()

    if (!body.seriesId) {
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
        id: body.seriesId,
      },
    })

    if (!series) {
      return NextResponse.json(
        {
          success: false,
          message: 'Series tidak ditemukan',
        },
        { status: 404 }
      )
    }

    const bookmark = await prisma.bookmark.upsert({
      where: {
        userId_seriesId: {
          userId: session.user.id,
          seriesId: body.seriesId,
        },
      },

      update: {},

      create: {
        userId: session.user.id,
        seriesId: body.seriesId,
      },
    })

    return NextResponse.json({
      success: true,
      data: bookmark,
    })
  } catch (error) {
    console.error('BOOKMARK_POST_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menambahkan bookmark',
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
    const seriesId = searchParams.get('seriesId')

    if (!seriesId) {
      return NextResponse.json(
        {
          success: false,
          message: 'seriesId diperlukan',
        },
        { status: 400 }
      )
    }

    await prisma.bookmark.deleteMany({
      where: {
        userId: session.user.id,
        seriesId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Bookmark dihapus',
    })
  } catch (error) {
    console.error('BOOKMARK_DELETE_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menghapus bookmark',
      },
      { status: 500 }
    )
  }
}
