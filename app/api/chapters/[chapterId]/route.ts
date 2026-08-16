import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { chapterId: string } }
) {
  try {
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
          },
        },
        images: {
          orderBy: {
            pageNumber: 'asc',
          },
        },
      },
    })

    if (
      !chapter ||
      !chapter.isPublished ||
      !chapter.series.published
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Chapter tidak ditemukan',
        },
        {
          status: 404,
        }
      )
    }

    await prisma.chapter.update({
      where: {
        id: chapter.id,
      },
      data: {
        views: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: chapter,
    })
  } catch (error) {
    console.error('CHAPTER_DETAIL_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil chapter',
      },
      {
        status: 500,
      }
    )
  }
}
