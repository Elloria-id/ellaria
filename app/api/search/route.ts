import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@prisma/client'

const VALID_TYPES = [
  'all',
  'series',
  'user',
  'translator',
  'creator',
  'community',
  'genre',
] as const

type SearchType = (typeof VALID_TYPES)[number]

function getType(value: string | null): SearchType {
  if (value && VALID_TYPES.includes(value as SearchType)) {
    return value as SearchType
  }

  return 'series'
}

function getPositiveInt(
  value: string | null,
  fallback: number,
  max: number
) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }

  return Math.min(Math.floor(parsed), max)
}

function isSeriesStatus(
  value: string
): value is 'ONGOING' | 'COMPLETED' | 'HIATUS' {
  return (
    value === 'ONGOING' ||
    value === 'COMPLETED' ||
    value === 'HIATUS'
  )
}

function isSeriesType(
  value: string
): value is
  | 'MANGA'
  | 'MANHWA'
  | 'MANHUA'
  | 'NOVEL'
  | 'ONE_SHOT' {
  return (
    value === 'MANGA' ||
    value === 'MANHWA' ||
    value === 'MANHUA' ||
    value === 'NOVEL' ||
    value === 'ONE_SHOT'
  )
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const q = searchParams.get('q')?.trim() || ''
    const type = getType(searchParams.get('type'))
    const genreSlugs = (searchParams.get('genre') || '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
    const status = searchParams.get('status')?.trim() || ''
    const contentType =
      searchParams.get('contentType')?.trim() || ''
    const sort = searchParams.get('sort') || 'latest'

    const page = getPositiveInt(
      searchParams.get('page'),
      1,
      100000
    )

    const limit = getPositiveInt(
      searchParams.get('limit'),
      20,
      100
    )

    const skip = (page - 1) * limit

    /*
     * GENRES
     *
     * Selalu ambil semua genre aktif.
     *
     * Ini penting karena halaman Search membutuhkan daftar
     * genre meskipun user belum mengetik keyword pencarian.
     */
    const allGenres = await prisma.genre.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    /*
     * GENRE SEARCH
     *
     * Kalau user mengetik keyword, genres juga difilter.
     * Kalau tidak mengetik keyword, semua genre tetap tersedia.
     */
    const genres = q
      ? allGenres.filter((item) => {
          const name = item.name.toLowerCase()
          const slug = item.slug.toLowerCase()
          const keyword = q.toLowerCase()

          return (
            name.includes(keyword) ||
            slug.includes(keyword)
          )
        })
      : allGenres

    /*
     * RESULT VARIABLES
     */

    let results: any[] = []
    let total = 0

    /*
     * =========================================================
     * SERIES
     * =========================================================
     */

    if (type === 'series' || type === 'all') {
      const where: Prisma.SeriesWhereInput = {
        published: true,
      }

      if (q) {
        where.OR = [
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
        ]
      }

      if (genreSlugs.length > 0) {
        where.genres = {
          some: {
            genre: {
              OR: [
                {
                  slug: {
                    in: genreSlugs,
                  },
                },
                {
                  name: {
                    in: genreSlugs,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },
        }
      }

      if (isSeriesStatus(status)) {
        where.status = status
      }

      if (isSeriesType(contentType)) {
        where.type = contentType
      }

      total = await prisma.series.count({
        where,
      })

      let orderBy: Prisma.SeriesOrderByWithRelationInput

      switch (sort) {
        case 'popular':
          orderBy = {
            views: 'desc',
          }
          break

        case 'rating':
          orderBy = {
            rating: 'desc',
          }
          break

        case 'a-z':
          orderBy = {
            title: 'asc',
          }
          break

        case 'z-a':
          orderBy = {
            title: 'desc',
          }
          break

        case 'latest':
        default:
          orderBy = {
            createdAt: 'desc',
          }
          break
      }

      const rawSeries = await prisma.series.findMany({
        where,
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
          readingCount: true,
          is18Plus: true,
          isPremium: true,

          genres: {
            select: {
              genre: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      })

      results = rawSeries.map((item) => ({
        ...item,

        genres: item.genres.map((itemGenre) => ({
          id: itemGenre.genre.id,
          name: itemGenre.genre.name,
          slug: itemGenre.genre.slug,
        })),
      }))
    }

    /*
     * =========================================================
     * USERS
     * =========================================================
     */

    if (type === 'user') {
      const where: Prisma.UserWhereInput = {
        isBanned: false,
      }

      if (q) {
        where.username = {
          contains: q,
          mode: 'insensitive',
        }
      }

      total = await prisma.user.count({
        where,
      })

      results = await prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          avatar: true,
          role: true,
          level: true,
        },
        orderBy: {
          username: 'asc',
        },
        skip,
        take: limit,
      })
    }

    /*
     * =========================================================
     * TRANSLATORS
     * =========================================================
     */

    if (type === 'translator') {
      const where: Prisma.TranslatorProfileWhereInput = {
        user: {
          isBanned: false,
        },
      }

      if (q) {
        where.OR = [
          {
            displayName: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            user: {
              username: {
                contains: q,
                mode: 'insensitive',
              },
            },
          },
        ]
      }

      total = await prisma.translatorProfile.count({
        where,
      })

      results =
        await prisma.translatorProfile.findMany({
          where,
          select: {
            id: true,
            userId: true,
            displayName: true,
            bio: true,
            languages: true,
            user: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            displayName: 'asc',
          },
          skip,
          take: limit,
        })
    }

    /*
     * =========================================================
     * CREATORS
     * =========================================================
     */

    if (type === 'creator') {
      const where: Prisma.CreatorProfileWhereInput = {
        user: {
          isBanned: false,
        },
      }

      if (q) {
        where.OR = [
          {
            displayName: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            user: {
              username: {
                contains: q,
                mode: 'insensitive',
              },
            },
          },
        ]
      }

      total = await prisma.creatorProfile.count({
        where,
      })

      results =
        await prisma.creatorProfile.findMany({
          where,
          select: {
            id: true,
            userId: true,
            displayName: true,
            bio: true,
            user: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            displayName: 'asc',
          },
          skip,
          take: limit,
        })
    }

    /*
     * =========================================================
     * COMMUNITIES
     * =========================================================
     */

    if (type === 'community') {
      const where: Prisma.CommunityWhereInput = {
        isActive: true,
      }

      if (q) {
        where.OR = [
          {
            name: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: q,
              mode: 'insensitive',
            },
          },
        ]
      }

      total = await prisma.community.count({
        where,
      })

      results = await prisma.community.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          avatar: true,
        },
        orderBy: {
          name: 'asc',
        },
        skip,
        take: limit,
      })
    }

    /*
     * =========================================================
     * GENRE
     * =========================================================
     */

    if (type === 'genre') {
      results = genres.slice(skip, skip + limit)
      total = genres.length
    }

    /*
     * =========================================================
     * ALL
     *
     * Untuk mode all, hasil utama tetap berupa series.
     * Entity lain tetap dikirim sebagai data tambahan.
     * =========================================================
     */

    let users: any[] = []
    let translators: any[] = []
    let creators: any[] = []
    let communities: any[] = []

    let usersTotal = 0
    let translatorsTotal = 0
    let creatorsTotal = 0
    let communitiesTotal = 0

    if (type === 'all') {
      const userWhere: Prisma.UserWhereInput = {
        isBanned: false,
      }

      if (q) {
        userWhere.username = {
          contains: q,
          mode: 'insensitive',
        }
      }

      usersTotal = await prisma.user.count({
        where: userWhere,
      })

      users = await prisma.user.findMany({
        where: userWhere,
        select: {
          id: true,
          username: true,
          avatar: true,
          role: true,
          level: true,
        },
        orderBy: {
          username: 'asc',
        },
        take: limit,
      })

      const translatorWhere: Prisma.TranslatorProfileWhereInput =
        {
          user: {
            isBanned: false,
          },
        }

      if (q) {
        translatorWhere.OR = [
          {
            displayName: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            user: {
              username: {
                contains: q,
                mode: 'insensitive',
              },
            },
          },
        ]
      }

      translatorsTotal =
        await prisma.translatorProfile.count({
          where: translatorWhere,
        })

      translators =
        await prisma.translatorProfile.findMany({
          where: translatorWhere,
          select: {
            id: true,
            userId: true,
            displayName: true,
            bio: true,
            languages: true,
            user: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            displayName: 'asc',
          },
          take: limit,
        })

      const creatorWhere: Prisma.CreatorProfileWhereInput = {
        user: {
          isBanned: false,
        },
      }

      if (q) {
        creatorWhere.OR = [
          {
            displayName: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            user: {
              username: {
                contains: q,
                mode: 'insensitive',
              },
            },
          },
        ]
      }

      creatorsTotal =
        await prisma.creatorProfile.count({
          where: creatorWhere,
        })

      creators =
        await prisma.creatorProfile.findMany({
          where: creatorWhere,
          select: {
            id: true,
            userId: true,
            displayName: true,
            bio: true,
            user: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            displayName: 'asc',
          },
          take: limit,
        })

      const communityWhere: Prisma.CommunityWhereInput = {
        isActive: true,
      }

      if (q) {
        communityWhere.OR = [
          {
            name: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: q,
              mode: 'insensitive',
            },
          },
        ]
      }

      communitiesTotal =
        await prisma.community.count({
          where: communityWhere,
        })

      communities =
        await prisma.community.findMany({
          where: communityWhere,
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            avatar: true,
          },
          orderBy: {
            name: 'asc',
          },
          take: limit,
        })
    }

    /*
     * =========================================================
     * RESPONSE
     * =========================================================
     */

    const pages =
      total > 0
        ? Math.ceil(total / limit)
        : 0

    return NextResponse.json({
      success: true,

      query: q,

      type,

      data: {
        results,
        series:
          type === 'all'
            ? results
            : type === 'series'
              ? results
              : [],

        users:
          type === 'all'
            ? users
            : type === 'user'
              ? results
              : [],

        translators:
          type === 'all'
            ? translators
            : type === 'translator'
              ? results
              : [],

        creators:
          type === 'all'
            ? creators
            : type === 'creator'
              ? results
              : [],

        communities:
          type === 'all'
            ? communities
            : type === 'community'
              ? results
              : [],

        genres,

        pagination: {
          page,
          limit,
          total,
          pages,
        },

        totals: {
          series:
            type === 'series' || type === 'all'
              ? total
              : 0,

          users:
            type === 'user'
              ? total
              : usersTotal,

          translators:
            type === 'translator'
              ? total
              : translatorsTotal,

          creators:
            type === 'creator'
              ? total
              : creatorsTotal,

          communities:
            type === 'community'
              ? total
              : communitiesTotal,

          genres: genres.length,
        },
      },
    })
  } catch (error) {
    console.error(
      'SEARCH_ERROR:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal melakukan pencarian',
        data: {
          results: [],
          series: [],
          users: [],
          translators: [],
          creators: [],
          communities: [],
          genres: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            pages: 0,
          },
        },
      },
      {
        status: 500,
      }
    )
  }
}
