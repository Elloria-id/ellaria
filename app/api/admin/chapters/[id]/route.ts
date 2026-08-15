import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'

const updateSchema = z.object({
  chapterNumber: z.number().optional(),
  title: z.string().optional(),
  contentType: z.enum(['IMAGE', 'NOVEL']).optional(),
  wordCount: z.number().optional(),
  coinPrice: z.number().min(0).optional(),
  isPremium: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  waitEnabled: z.boolean().optional(),
  waitSeconds: z.number().min(0).optional(),
  isPublished: z.boolean().optional(),
})

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = updateSchema.parse(body)

    const chapter = await prisma.chapter.update({
      where: { id: params.id },
      data: validated,
    })

    return NextResponse.json({
      success: true,
      data: chapter,
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.chapter.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Chapter dihapus',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
