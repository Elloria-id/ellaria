import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'

const commentSchema = z.object({
  seriesId: z.string().optional(),
  chapterId: z.string().optional(),
  content: z.string().min(1).max(1000),
  isSpoiler: z.boolean().default(false),
  parentId: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const seriesId = url.searchParams.get('seriesId')
    const chapterId = url.searchParams.get('chapterId')
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Number(url.searchParams.get('limit')) || 20

    const where: any = {
      isHidden: false,
    }

    if (seriesId) where.seriesId = seriesId
    if (chapterId) where.chapterId = chapterId

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
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
          replies: {
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
            orderBy: { createdAt: 'asc' },
          },
          _count: {
            select: { likes: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
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
    const validated = commentSchema.parse(body)

    const comment = await prisma.comment.create({
      data: {
        userId: session.user.id,
        seriesId: validated.seriesId,
        chapterId: validated.chapterId,
        content: validated.content,
        isSpoiler: validated.isSpoiler,
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

    // Reply notification
    if (validated.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validated.parentId },
      })
      if (parentComment && parentComment.userId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: parentComment.userId,
            type: 'COMMENT_REPLY',
            title: 'Balasan Komentar',
            message: `${session.user.username} membalas komentar Anda`,
            data: {
              commentId: comment.id,
              seriesId: validated.seriesId,
              chapterId: validated.chapterId,
            },
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: comment,
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
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'id diperlukan' },
        { status: 400 }
      )
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
    })

    if (!comment) {
      return NextResponse.json(
        { success: false, message: 'Komentar tidak ditemukan' },
        { status: 404 }
      )
    }

    const isOwner = comment.userId === session.user.id
    const isModerator = ['ADMIN', 'FOUNDER', 'MODERATOR'].includes(session.user.role)

    if (!isOwner && !isModerator) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    if (isModerator && !isOwner) {
      await prisma.comment.update({
        where: { id },
        data: { isHidden: true },
      })
    } else {
      await prisma.comment.delete({
        where: { id },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Komentar dihapus',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
