import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const page = Math.max(
      1,
      Number(searchParams.get('page') || 1)
    )

    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get('limit') || 20))
    )

    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const genre = searchParams.get('genre')
    const sort = searchParams.get('sort') || 'latest'

    const where: any = {
      published: true,
    }

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    if (genre) {
      where.genres = {
        some: {
          genre: {
            slug: genre,
          },
        },
      }
    }

    let orderBy: any = {
      createdAt: 'desc',
    }

    if (sort === 'popular') {
      orderBy = {
        views: 'desc',
      }
    }

    if (sort === 'rating') {
      orderBy = {
        rating: 'desc',
      }
    }

    const [series, total] = await prisma.$transaction([
      prisma.series.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
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
            take: 1,
            select: {
              id: true,
              chapterNumber: true,
              title: true,
              isPremium: true,
              createdAt: true,
            },
          },
        },
      }),

      prisma.series.count({
        where,
      }),
    ])

    return NextResponse.json({
      success: true,
      data: series,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('SERIES_LIST_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil daftar series',
      },
      {
        status: 500,
      }
    )
  }
}
