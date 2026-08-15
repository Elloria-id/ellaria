import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  type: z.enum(['MANGA', 'MANHWA', 'MANHUA', 'NOVEL', 'ONE_SHOT']).optional(),
  genre: z.string().optional(),
  status: z.enum(['ONGOING', 'COMPLETED', 'HIATUS']).optional(),
  search: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const params = Object.fromEntries(url.searchParams)
    const validated = querySchema.parse(params)

    const { page, limit, type, genre, status, search } = validated
    const skip = (page - 1) * limit

    const where: any = { published: true }

    if (type) where.type = type
    if (status) where.status = status
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { alternativeTitle: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { artist: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (genre) {
      where.genres = {
        some: {
          genre: { slug: genre },
        },
      }
    }

    const [series, total] = await Promise.all([
      prisma.series.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          genres: { include: { genre: true } },
          chapters: {
            where: { isPublished: true },
            orderBy: { chapterNumber: 'desc' },
            take: 1,
          },
          _count: {
            select: { chapters: true, bookmarks: true },
          },
        },
      }),
      prisma.series.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        series,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Parameter tidak valid' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
