import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const q = searchParams.get('q')?.trim() || ''
    const category = searchParams.get('category') || 'all'

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

    const result: any = {
      series: [],
      users: [],
      genres: [],
    }

    if (category === 'all' || category === 'series') {
      result.series = await prisma.series.findMany({
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
        take: 20,
        orderBy: {
          views: 'desc',
        },
        select: {
          id: true,
          title: true,
          slug: true,
          alternativeTitle: true,
          cover: true,
          type: true,
          status: true,
          label: true,
          rating: true,
          views: true,
        },
      })
    }

    if (category === 'all' || category === 'user') {
      result.users = await prisma.user.findMany({
        where: {
          isBanned: false,
          OR: [
            {
              username: {
                contains: q,
                mode: 'insensitive',
              },
            },
            {
              bio: {
                contains: q,
                mode: 'insensitive',
              },
            },
          ],
        },
        take: 20,
        select: {
          id: true,
          username: true,
          avatar: true,
          bio: true,
          role: true,
          level: true,
        },
      })
    }

    if (category === 'all' || category === 'genre') {
      result.genres = await prisma.genre.findMany({
        where: {
          isActive: true,
          name: {
            contains: q,
            mode: 'insensitive',
          },
        },
        take: 20,
      })
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('SEARCH_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Pencarian gagal',
      },
      {
        status: 500,
      }
    )
  }
}
