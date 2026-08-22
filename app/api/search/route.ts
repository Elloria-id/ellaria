import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@prisma/client'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

const validTypes = [
  'all',
  'series',
  'translator',
  'creator',
  'user',
  'community',
] as const

const validSeriesTypes = [
  'MANGA',
  'MANHWA',
  'MANHUA',
  'NOVEL',
  'ONE_SHOT',
] as const

const validStatuses = [
  'ONGOING',
  'COMPLETED',
  'HIATUS',
] as const

type SearchType = (typeof validTypes)[number]

function isSearchType(value: string): value is SearchType {
  return validTypes.includes(value as SearchType)
}

function isSeriesType(
  value: string
): value is (typeof validSeriesTypes)[number] {
  return validSeriesTypes.includes(
    value as (typeof validSeriesTypes)[number]
  )
}

function isSeriesStatus(
  value: string
): value is (typeof validStatuses)[number] {
  return validStatuses.includes(
    value as (typeof validStatuses)[number]
  )
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const q = searchParams.get('q')?.trim() || ''
    const typeParam = searchParams.get('type') || 'all'
    const genre = searchParams.get('genre')?.trim() || ''
    const status = searchParams.get('status')?.trim().toUpperCase() || ''
    const contentType =
      searchParams.get('contentType')?.trim().toUpperCase() || ''
    const sort = searchParams.get('sort') || 'latest'

    const pageParam = Number(searchParams.get('page') || '1')
    const limitParam = Number(
      searchParams.get('limit') || DEFAULT_LIMIT
    )

    const page =
      Number.isFinite(pageParam) && pageParam > 0
        ? Math.floor(pageParam)
        : 1

    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(Math.floor(limitParam), MAX_LIMIT)
        : DEFAULT_LIMIT

    const type: SearchType = isSearchType(typeParam)
      ? typeParam
      : 'all'

    const skip = (page - 1) * limit

    /*
     * GENRE LIST
     *
     * Selalu dikembalikan supaya halaman Search bisa
     * menampilkan seluruh genre aktif walaupun user
     * belum memasukkan keyword.
     */
    const genres = await prisma.genre.findMany({
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
     * SERIES
     */
    const shouldSearchSeries =
      type === 'all' || type === 'series'

    let series: Array<{
      id: string
      title: string
      slug: string
      cover: string | null
      type: string
      status: string
      label: string
      rating: number
      views: number
      readingCount: number
      is18Plus: boolean
      isPremium: boolean
      genres: Array<{
        id: string
        name: string
        slug: string
      }>
    }> = []

    let seriesTotal = 0

    if (shouldSearchSeries) {
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

      if (genre) {
        where.genres = {
          some: {
            genre: {
              OR: [
                {
                  slug: genre,
                },
                {
                  name: {
                    equals: genre,
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

      switch (sort) {
        case 'popular':
          seriesTotal = await prisma.series.count({
            where,
          })

          series = await prisma.series.findMany({
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
            orderBy: [
              {
                views: 'desc',
              },
              {
                readingCount: 'desc',
              },
            ],
            skip,
            take: limit,
          })

          break

        case 'rating':
          seriesTotal = await prisma.series.count({
            where,
          })

          series = await prisma.series.findMany({
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
            orderBy: [
              {
                rating: 'desc',
              },
              {
                views: 'desc',
              },
            ],
            skip,
            take: limit,
          })

          break

        case 'a-z':
          seriesTotal = await prisma.series.count({
            where,
          })

          series = await prisma.series.findMany({
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
            orderBy: {
              title: 'asc',
            },
            skip,
            take: limit,
          })

          break

        case 'z-a':
          seriesTotal = await prisma.series.count({
            where,
          })

          series = await prisma.series.findMany({
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
            orderBy: {
              title: 'desc',
            },
            skip,
            take: limit,
          })

          break

        case 'latest':
        default:
          seriesTotal = await prisma.series.count({
            where,
          })

          series = await prisma.series.findMany({
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
            orderBy: [
              {
                createdAt: 'desc',
              },
              {
                title: 'asc',
              },
            ],
            skip,
            take: limit,
          })

          break
      }

      series = series.map((item) => ({
        ...item,
        genres: item.genres.map((itemGenre) => itemGenre.genre),
      }))
    }

    /*
     * USERS
     */
    const shouldSearchUsers =
      type === 'all' || type === 'user'

    let users: Array<{
      id: string
      username: string
      avatar: string | null
      role: string
      level: number
    }> = []

    let usersTotal = 0

    if (shouldSearchUsers && q) {
      const userWhere: Prisma.UserWhereInput = {
        isBanned: false,
        username: {
          contains: q,
          mode: 'insensitive',
        },
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
        skip,
        take: limit,
      })
    }

    /*
     * TRANSLATORS
     */
    const shouldSearchTranslators =
      type === 'all' || type === 'translator'

    let translators: Array<{
      id: string
      userId: string
      displayName: string | null
      bio: string | null
      languages: string[]
      user: {
        username: string
        avatar: string | null
      }
    }> = []

    let translatorsTotal = 0

    if (shouldSearchTranslators && q) {
      const translatorWhere: Prisma.TranslatorProfileWhereInput = {
        user: {
          isBanned: false,
        },
        OR: [
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
        ],
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
          skip,
          take: limit,
        })
    }

    /*
     * CREATORS
     */
    const shouldSearchCreators =
      type === 'all' || type === 'creator'

    let creators: Array<{
      id: string
      userId: string
      displayName: string | null
      bio: string | null
      user: {
        username: string
        avatar: string | null
      }
    }> = []

    let creatorsTotal = 0

    if (shouldSearchCreators && q) {
      const creatorWhere: Prisma.CreatorProfileWhereInput = {
        user: {
          isBanned: false,
        },
        OR: [
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
        ],
      }

      creatorsTotal =
        await prisma.creatorProfile.count({
          where: creatorWhere,
        })

      creators = await prisma.creatorProfile.findMany({
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
        skip,
        take: limit,
      })
    }

    /*
     * COMMUNITIES
     */
    const shouldSearchCommunities =
      type === 'all' || type === 'community'

    let communities: Array<{
      id: string
      name: string
      description: string | null
      type: string
      avatar: string | null
    }> = []

    let communitiesTotal = 0

    if (shouldSearchCommunities && q) {
      const communityWhere: Prisma.CommunityWhereInput = {
        isActive: true,
        OR: [
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
        ],
      }

      communitiesTotal =
        await prisma.community.count({
          where: communityWhere,
        })

      communities = await prisma.community.findMany({
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
        skip,
        take: limit,
      })
    }

    /*
     * GENRE SEARCH
     *
     * Jika keyword diisi, kembalikan genre yang cocok.
     * Ini berbeda dengan daftar genres di atas yang
     * selalu mengembalikan semua genre aktif.
     */
    const matchedGenres = q
      ? genres.filter((item) => {
          const name = item.name.toLowerCase()
          const slug = item.slug.toLowerCase()
          const keyword = q.toLowerCase()

          return (
            name.includes(keyword) ||
            slug.includes(keyword)
          )
        })
      : []

    let total = 0

    switch (type) {
      case 'series':
        total = seriesTotal
        break

      case 'user':
        total = usersTotal
        break

      case 'translator':
        total = translatorsTotal
        break

      case 'creator':
        total = creatorsTotal
        break

      case 'community':
        total = communitiesTotal
        break

      case 'all':
      default:
        total =
          seriesTotal +
          usersTotal +
          translatorsTotal +
          creatorsTotal +
          communitiesTotal
        break
    }

    const pages =
      total > 0 ? Math.ceil(total / limit) : 0

    return NextResponse.json({
      success: true,
      query: q,
      data: {
        results:
          type === 'series'
            ? series
            : type === 'user'
              ? users
              : type === 'translator'
                ? translators
                : type === 'creator'
                  ? creators
                  : type === 'community'
                    ? communities
                    : [],
        series,
        users,
        translators,
        creators,
        communities,
        genres,
        matchedGenres,
        pagination: {
          page,
          limit,
          total,
          pages,
        },
      },
    })
  } catch (error) {
    console.error('SEARCH_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal melakukan pencarian',
      },
      {
        status: 500,
      }
    )
  }
}
