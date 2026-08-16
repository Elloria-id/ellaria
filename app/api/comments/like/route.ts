import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const schema = z.object({
  commentId: z.string().min(1),
})

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
    const { commentId } = schema.parse(body)

    const comment = await prisma.comment.findUnique({
      where: {
        id: commentId,
      },
      select: {
        id: true,
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

    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId,
        },
      },
    })

    if (existingLike) {
      await prisma.commentLike.delete({
        where: {
          id: existingLike.id,
        },
      })

      const count = await prisma.commentLike.count({
        where: {
          commentId,
        },
      })

      return NextResponse.json({
        success: true,
        liked: false,
        likes: count,
      })
    }

    await prisma.commentLike.create({
      data: {
        userId: session.user.id,
        commentId,
      },
    })

    const count = await prisma.commentLike.count({
      where: {
        commentId,
      },
    })

    return NextResponse.json({
      success: true,
      liked: true,
      likes: count,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Data tidak valid',
        },
        { status: 400 }
      )
    }

    console.error('COMMENT LIKE ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal memproses like',
      },
      { status: 500 }
    )
  }
}
