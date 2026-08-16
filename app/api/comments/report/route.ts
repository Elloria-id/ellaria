import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const schema = z.object({
  commentId: z.string().min(1),
  reason: z.string().min(3).max(500),
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

    const existingReport = await prisma.commentReport.findFirst({
      where: {
        commentId: data.commentId,
        userId: session.user.id,
        status: 'PENDING',
      },
    })

    if (existingReport) {
      return NextResponse.json(
        {
          success: false,
          message: 'Kamu sudah melaporkan komentar ini',
        },
        { status: 409 }
      )
    }

    const report = await prisma.commentReport.create({
      data: {
        commentId: data.commentId,
        userId: session.user.id,
        reason: data.reason,
        status: 'PENDING',
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Komentar berhasil dilaporkan',
        reportId: report.id,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Data laporan tidak valid',
        },
        { status: 400 }
      )
    }

    console.error('COMMENT REPORT ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengirim laporan',
      },
      { status: 500 }
    )
  }
}
