import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'

const bookmarkSchema = z.object({
  seriesId: z.string(),
})

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const sort = url.searchParams.get('sort') || 'newest'

    const orderBy: any = {}
    if (sort === 'newest') orderBy.createdAt = 'desc'
    else if (sort === 'oldest') orderBy.createdAt = 'asc'
    else if (sort === 'title') orderBy.series = { title: 'asc' }

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: session.user.id },
      include: {
        series: {
          include: {
            genres: { include: { genre: true } },
            chapters: {
              where: { isPublished: true },
              orderBy: { chapterNumber: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy,
    })

    return NextResponse.json({
      success: true,
      data: bookmarks,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = bookmarkSchema.parse(body)

    const bookmark = await prisma.bookmark.upsert({
      where: {
        userId_seriesId: {
          userId: session.user.id,
          seriesId: validated.seriesId,
        },
      },
      update: {},
      create: {
        userId: session.user.id,
        seriesId: validated.seriesId,
      },
    })

    return NextResponse.json({
      success: true,
      data: bookmark,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Input tidak valid' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const seriesId = url.searchParams.get('seriesId')

    if (!seriesId) {
      return NextResponse.json(
        { success: false, message: 'seriesId diperlukan' },
        { status: 400 }
      )
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_seriesId: {
          userId: session.user.id,
          seriesId,
        },
      },
    })

    if (!bookmark) {
      return NextResponse.json(
        { success: false, message: 'Bookmark tidak ditemukan' },
        { status: 404 }
      )
    }

    await prisma.bookmark.delete({
      where: {
        userId_seriesId: {
          userId: session.user.id,
          seriesId,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Bookmark dihapus',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
