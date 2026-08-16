import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    const body = await req.json()

    if (
      !body.seriesId ||
      !body.chapterId
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'seriesId dan chapterId diperlukan',
        },
        { status: 400 }
      )
    }

    const chapter = await prisma.chapter.findUnique({
      where: {
        id: body.chapterId,
      },
      select: {
        id: true,
        seriesId: true,
      },
    })

    if (!chapter || chapter.seriesId !== body.seriesId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Chapter tidak valid',
        },
        { status: 400 }
      )
    }

    const lastPage = Math.max(
      0,
      Number(body.lastPage || 0)
    )

    const progress = Math.max(
      0,
      Math.min(
        100,
        Number(body.progress || 0)
      )
    )

    const result =
      await prisma.readingProgress.upsert({
        where: {
          userId_seriesId_chapterId: {
            userId: session.user.id,
            seriesId: body.seriesId,
            chapterId: body.chapterId,
          },
        },

        update: {
          lastPage,
          progress,
          lastReadAt: new Date(),
        },

        create: {
          userId: session.user.id,
          seriesId: body.seriesId,
          chapterId: body.chapterId,
          lastPage,
          progress,
          lastReadAt: new Date(),
        },
      })

    await prisma.readingHistory.deleteMany({
      where: {
        userId: session.user.id,
        seriesId: body.seriesId,
        chapterId: body.chapterId,
      },
    })

    await prisma.readingHistory.create({
      data: {
        userId: session.user.id,
        seriesId: body.seriesId,
        chapterId: body.chapterId,
        progress,
        lastReadAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('READING_PROGRESS_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menyimpan progress',
      },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)

    const chapterId =
      searchParams.get('chapterId')

    const seriesId =
      searchParams.get('seriesId')

    if (!chapterId || !seriesId) {
      return NextResponse.json(
        {
          success: false,
          message: 'chapterId dan seriesId diperlukan',
        },
        { status: 400 }
      )
    }

    const progress =
      await prisma.readingProgress.findUnique({
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
      data: progress,
    })
  } catch (error) {
    console.error('READING_PROGRESS_GET_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil progress',
      },
      { status: 500 }
    )
  }
}
