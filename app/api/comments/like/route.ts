import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'

const likeSchema = z.object({
  commentId: z.string(),
})

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
    const validated = likeSchema.parse(body)

    const comment = await prisma.comment.findUnique({
      where: { id: validated.commentId },
    })

    if (!comment) {
      return NextResponse.json(
        { success: false, message: 'Komentar tidak ditemukan' },
        { status: 404 }
      )
    }

    const like = await prisma.commentLike.upsert({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId: validated.commentId,
        },
      },
      update: {},
      create: {
        userId: session.user.id,
        commentId: validated.commentId,
      },
    })

    return NextResponse.json({
      success: true,
      data: like,
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
    const commentId = url.searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json(
        { success: false, message: 'commentId diperlukan' },
        { status: 400 }
      )
    }

    await prisma.commentLike.delete({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Like dihapus',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
