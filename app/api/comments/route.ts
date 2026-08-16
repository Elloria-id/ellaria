import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createCommentSchema = z.object({
  seriesId: z.string().optional(),
  chapterId: z.string().optional(),
  content: z.string().min(1).max(2000),
  isSpoiler: z.boolean().optional().default(false),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const seriesId = searchParams.get('seriesId')
    const chapterId = searchParams.get('chapterId')

    if (!seriesId && !chapterId) {
      return NextResponse.json(
        { success: false, message: 'seriesId atau chapterId diperlukan' },
        { status: 400 }
      )
    }

    const comments = await prisma.comment.findMany({
      where: {
        ...(seriesId ? { seriesId } : {}),
        ...(chapterId ? { chapterId } : {}),
        isHidden: false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true,
            level: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        replies: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                role: true,
                level: true,
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
      comments,
    })
  } catch (error) {
    console.error('GET COMMENTS ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil komentar',
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
          message: 'Silakan login terlebih dahulu',
        },
        { status: 401 }
      )
    }

    const body = await req.json()
    const data = createCommentSchema.parse(body)

    if (!data.seriesId && !data.chapterId) {
      return NextResponse.json(
        {
          success: false,
          message: 'seriesId atau chapterId diperlukan',
        },
        { status: 400 }
      )
    }

    if (data.seriesId) {
      const series = await prisma.series.findUnique({
        where: {
          id: data.seriesId,
        },
        select: {
          id: true,
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
    }

    if (data.chapterId) {
      const chapter = await prisma.chapter.findUnique({
        where: {
          id: data.chapterId,
        },
        select: {
          id: true,
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
    }

    const comment = await prisma.comment.create({
      data: {
        userId: session.user.id,
        seriesId: data.seriesId,
        chapterId: data.chapterId,
        content: data.content,
        isSpoiler: data.isSpoiler,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true,
            level: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Komentar berhasil dibuat',
        comment,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Komentar tidak valid',
          errors: error.flatten(),
        },
        { status: 400 }
      )
    }

    console.error('POST COMMENT ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal membuat komentar',
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
          message: 'Silakan login terlebih dahulu',
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const commentId = searchParams.get('id')

    if (!commentId) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID komentar diperlukan',
        },
        { status: 400 }
      )
    }

    const comment = await prisma.comment.findUnique({
      where: {
        id: commentId,
      },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!comment) {
      return NextResponse.json(
        {
          success: false,
          message: 'Komentar tidak ditemukan',
        },
        { status: 404 }
      )
    }

    const role = session.user.role

    const canDelete =
      comment.userId === session.user.id ||
      role === 'ADMIN' ||
      role === 'FOUNDER' ||
      role === 'MODERATOR'

    if (!canDelete) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tidak memiliki izin',
        },
        { status: 403 }
      )
    }

    await prisma.comment.delete({
      where: {
        id: commentId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Komentar berhasil dihapus',
    })
  } catch (error) {
    console.error('DELETE COMMENT ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menghapus komentar',
      },
      { status: 500 }
    )
  }
}
