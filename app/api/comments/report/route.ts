import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'

const reportSchema = z.object({
  commentId: z.string(),
  reason: z.string(),
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
    const validated = reportSchema.parse(body)

    const comment = await prisma.comment.findUnique({
      where: { id: validated.commentId },
    })

    if (!comment) {
      return NextResponse.json(
        { success: false, message: 'Komentar tidak ditemukan' },
        { status: 404 }
      )
    }

    const report = await prisma.commentReport.create({
      data: {
        commentId: validated.commentId,
        userId: session.user.id,
        reason: validated.reason,
      },
    })

    return NextResponse.json({
      success: true,
      data: report,
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
