import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const series = await prisma.series.findUnique({
      where: {
        slug: params.slug,
      },
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        chapters: {
          where: {
            isPublished: true,
          },
          orderBy: {
            chapterNumber: 'desc',
          },
          select: {
            id: true,
            chapterNumber: true,
            title: true,
            contentType: true,
            coinPrice: true,
            isPremium: true,
            isLocked: true,
            waitEnabled: true,
            waitSeconds: true,
            views: true,
            createdAt: true,
          },
        },
      },
    })

    if (!series || !series.published) {
      return NextResponse.json(
        {
          success: false,
          message: 'Series tidak ditemukan',
        },
        {
          status: 404,
        }
      )
    }

    return NextResponse.json({
      success: true,
      data: series,
    })
  } catch (error) {
    console.error('SERIES_DETAIL_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil detail series',
      },
      {
        status: 500,
      }
    )
  }
}
