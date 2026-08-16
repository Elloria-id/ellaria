import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

type Params = {
  params: {
    chapterId: string
  }
}

export async function GET(
  _req: Request,
  { params }: Params
) {
  try {
    const session = await getServerSession(authOptions)

    const chapter = await prisma.chapter.findUnique({
      where: {
        id: params.chapterId,
      },

      include: {
        series: {
          select: {
            id: true,
            title: true,
            slug: true,
            cover: true,
            type: true,
            label: true,
            is18Plus: true,
          },
        },

        images: {
          orderBy: {
            pageNumber: 'asc',
          },
        },
      },
    })

    if (!chapter || !chapter.isPublished) {
      return NextResponse.json(
        {
          success: false,
          message: 'Chapter tidak ditemukan',
        },
        { status: 404 }
      )
    }

    let unlocked = false

    if (session?.user?.id) {
      const entitlement =
        await prisma.chapterEntitlement.findUnique({
          where: {
            userId_chapterId: {
              userId: session.user.id,
              chapterId: chapter.id,
            },
          },
        })

      unlocked = !!entitlement
    }

    const isFree =
      !chapter.isPremium &&
      !chapter.isLocked

    const canRead = isFree || unlocked

    return NextResponse.json({
      success: true,

      data: {
        id: chapter.id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        contentType: chapter.contentType,
        coinPrice: chapter.coinPrice,
        isPremium: chapter.isPremium,
        isLocked: chapter.isLocked,
        waitEnabled: chapter.waitEnabled,
        waitSeconds: chapter.waitSeconds,
        views: chapter.views,

        unlocked,
        canRead,

        series: chapter.series,

        images: canRead
          ? chapter.images
          : [],
      },
    })
  } catch (error) {
    console.error('CHAPTER_GET_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil chapter',
      },
      { status: 500 }
    )
  }
}
