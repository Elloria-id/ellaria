import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'

const chapterSchema = z.object({
  seriesId: z.string(),
  chapterNumber: z.number(),
  title: z.string().optional(),
  contentType: z.enum(['IMAGE', 'NOVEL']).default('IMAGE'),
  wordCount: z.number().optional(),
  coinPrice: z.number().min(0).default(1),
  isPremium: z.boolean().default(false),
  isLocked: z.boolean().default(false),
  waitEnabled: z.boolean().default(false),
  waitSeconds: z.number().min(0).default(6),
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

    if (!['CREATOR', 'ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validated = chapterSchema.parse(body)

    // Verify ownership
    const series = await prisma.series.findUnique({
      where: { id: validated.seriesId },
    })

    if (!series) {
      return NextResponse.json(
        { success: false, message: 'Series tidak ditemukan' },
        { status: 404 }
      )
    }

    if (series.ownerId !== session.user.id && !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - bukan pemilik series' },
        { status: 403 }
      )
    }

    const chapter = await prisma.chapter.create({
      data: {
        seriesId: validated.seriesId,
        chapterNumber: validated.chapterNumber,
        title: validated.title,
        contentType: validated.contentType,
        wordCount: validated.wordCount,
        coinPrice: validated.coinPrice,
        isPremium: validated.isPremium,
        isLocked: validated.isLocked,
        waitEnabled: validated.waitEnabled,
        waitSeconds: validated.waitSeconds,
        isPublished: false, // Draft by default
      },
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
