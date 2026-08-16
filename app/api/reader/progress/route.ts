import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()

    const seriesId = String(body.seriesId || '')
    const chapterId = String(body.chapterId || '')
    const lastPage = Math.max(
      0,
      Number(body.lastPage || 0)
    )
    const progress = Math.max(
      0,
      Math.min(100, Number(body.progress || 0))
    )

    if (!seriesId || !chapterId) {
      return NextResponse.json(
        {
          success: false,
          message: 'seriesId dan chapterId diperlukan',
        },
        { status: 400 }
      )
    }

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        seriesId,
        isPublished: true,
      },
    })

    if (!chapter) {
      return NextResponse.json(
        {
          success: false,
          message: 'Chapter tidak ditemukan',
        },
        { status: 404 }
      )
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const saved = await tx.readingProgress.upsert({
          where: {
            userId_seriesId_chapterId: {
              userId: session.user.id,
              seriesId,
              chapterId,
            },
          },
          create: {
            userId: session.user.id,
            seriesId,
            chapterId,
            lastPage,
            progress,
          },
          update: {
            lastPage,
            progress,
            lastReadAt: new Date(),
          },
        })

        await tx.readingHistory.upsert({
          where: {
            id: `${session.user.id}_${seriesId}_${chapterId}`,
          },
          create: {
            id: `${session.user.id}_${seriesId}_${chapterId}`,
            userId: session.user.id,
            seriesId,
            chapterId,
            progress,
          },
          update: {
            progress,
            lastReadAt: new Date(),
          },
        })

        return saved
      }
    )

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('READER_PROGRESS_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menyimpan progress',
      },
      { status: 500 }
    )
  }
}
