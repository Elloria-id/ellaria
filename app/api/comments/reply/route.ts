import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const schema = z.object({
  commentId: z.string().min(1),
  content: z.string().min(1).max(2000),
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
    const data = schema.parse(body)

    const comment = await prisma.comment.findUnique({
      where: {
        id: data.commentId,
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

    const reply = await prisma.commentReply.create({
      data: {
        commentId: data.commentId,
        userId: session.user.id,
        content: data.content,
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
        message: 'Balasan berhasil dibuat',
        reply,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Data balasan tidak valid',
        },
        { status: 400 }
      )
    }

    console.error('COMMENT REPLY ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal membuat balasan',
      },
      { status: 500 }
    )
  }
}
