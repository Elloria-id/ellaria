import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const q = searchParams.get('q')?.trim()
    const category =
      searchParams.get('category') || 'all'

    if (!q) {
      return NextResponse.json({
        success: true,
        data: {
          series: [],
          users: [],
          genres: [],
        },
      })
    }

    const result: {
      series: any[]
      users: any[]
      genres: any[]
    } = {
      series: [],
      users: [],
      genres: [],
    }

    if (
      category === 'all' ||
      category === 'series'
    ) {
      result.series =
        await prisma.series.findMany({
          where: {
            published: true,
            OR: [
              {
                title: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
              {
                alternativeTitle: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
              {
                author: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
              {
                artist: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
            ],
          },

          select: {
            id: true,
            title: true,
            slug: true,
            cover: true,
            type: true,
            status: true,
            label: true,
            rating: true,
            views: true,
          },

          orderBy: {
            views: 'desc',
          },

          take: 20,
        })
    }

    if (
      category === 'all' ||
      category === 'user'
    ) {
      result.users =
        await prisma.user.findMany({
          where: {
            isBanned: false,
            OR: [
              {
                username: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
            ],
          },

          select: {
            id: true,
            username: true,
            avatar: true,
            role: true,
            level: true,
          },

          take: 20,
        })
    }

    if (
      category === 'all' ||
      category === 'genre'
    ) {
      result.genres =
        await prisma.genre.findMany({
          where: {
            isActive: true,
            OR: [
              {
                name: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
              {
                slug: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
            ],
          },

          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },

          take: 20,
        })
    }

    return NextResponse.json({
      success: true,
      query: q,
      category,
      data: result,
    })
  } catch (error) {
    console.error('SEARCH_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal melakukan pencarian',
      },
      { status: 500 }
    )
  }
}
