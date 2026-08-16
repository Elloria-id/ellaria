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

    const search = searchParams.get('search')?.trim()
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const genre = searchParams.get('genre')

    const where: any = {
      published: true,
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          alternativeTitle: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          author: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
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

    const [series, total] = await Promise.all([
      prisma.series.findMany({
        where,
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
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
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
    console.error('SERIES_GET_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil daftar series',
      },
      { status: 500 }
    )
  }
}
