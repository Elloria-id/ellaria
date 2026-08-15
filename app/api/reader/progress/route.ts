import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'

const progressSchema = z.object({
  seriesId: z.string(),
  chapterId: z.string(),
  lastPage: z.number().int().min(0),
  totalPages: z.number().int().min(1),
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
    const validated = progressSchema.parse(body)

    const progress = await prisma.readingProgress.upsert({
      where: {
        userId_seriesId_chapterId: {
          userId: session.user.id,
          seriesId: validated.seriesId,
          chapterId: validated.chapterId,
        },
      },
      update: {
        lastPage: validated.lastPage,
        progress: validated.lastPage / validated.totalPages,
        lastReadAt: new Date(),
      },
      create: {
        userId: session.user.id,
        seriesId: validated.seriesId,
        chapterId: validated.chapterId,
        lastPage: validated.lastPage,
        progress: validated.lastPage / validated.totalPages,
      },
    })

    await prisma.readingHistory.upsert({
      where: {
        userId_seriesId_chapterId: {
          userId: session.user.id,
          seriesId: validated.seriesId,
          chapterId: validated.chapterId,
        },
      },
      update: { lastReadAt: new Date() },
      create: {
        userId: session.user.id,
        seriesId: validated.seriesId,
        chapterId: validated.chapterId,
      },
    })

    return NextResponse.json({
      success: true,
      data: progress,
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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const seriesId = url.searchParams.get('seriesId')
    const chapterId = url.searchParams.get('chapterId')

    if (!seriesId || !chapterId) {
      return NextResponse.json(
        { success: false, message: 'seriesId dan chapterId diperlukan' },
        { status: 400 }
      )
    }

    const progress = await prisma.readingProgress.findUnique({
      where: {
        userId_seriesId_chapterId: {
          userId: session.user.id,
          seriesId,
          chapterId,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: progress || null,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
