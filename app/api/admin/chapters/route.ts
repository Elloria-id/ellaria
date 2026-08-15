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
  isPublished: z.boolean().default(true),
})

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const seriesId = url.searchParams.get('seriesId')
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Number(url.searchParams.get('limit')) || 20

    if (!seriesId) {
      return NextResponse.json(
        { success: false, message: 'seriesId diperlukan' },
        { status: 400 }
      )
    }

    const [chapters, total] = await Promise.all([
      prisma.chapter.findMany({
        where: { seriesId },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { images: true },
          },
        },
        orderBy: { chapterNumber: 'desc' },
      }),
      prisma.chapter.count({ where: { seriesId } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        chapters,
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
    if (!session || !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = chapterSchema.parse(body)

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
        isPublished: validated.isPublished,
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
