import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const searchSchema = z.object({
  q: z.string().default(''),
  type: z.enum(['series', 'user', 'translator', 'community']).default('series'),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  genre: z.string().optional(),
  status: z.string().optional(),
  contentType: z.enum(['MANGA', 'MANHWA', 'MANHUA', 'NOVEL', 'ONE_SHOT']).optional(),
})

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const params = Object.fromEntries(url.searchParams)
    const validated = searchSchema.parse(params)

    const { q, type, page, limit, genre, status, contentType } = validated
    const skip = (page - 1) * limit

    let data: any[] = []
    let total = 0
    let searchType = type

    if (type === 'series') {
      const where: any = { published: true }
      if (q) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { alternativeTitle: { contains: q, mode: 'insensitive' } },
          { author: { contains: q, mode: 'insensitive' } },
          { artist: { contains: q, mode: 'insensitive' } },
        ]
      }
      if (genre) {
        where.genres = {
          some: { genre: { slug: genre } },
        }
      }
      if (status) {
        where.status = status
      }
      if (contentType) {
        where.type = contentType
      }

      const result = await prisma.series.findMany({
        where,
        skip,
        take: limit,
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
        orderBy: { views: 'desc' },
      })
      data = result
      total = await prisma.series.count({ where })
    } else if (type === 'user') {
      const where: any = {}
      if (q) {
        where.OR = [
          { username: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ]
      }
      const result = await prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          avatar: true,
          bio: true,
          role: true,
          level: true,
          exp: true,
          createdAt: true,
        },
        orderBy: { level: 'desc' },
      })
      data = result
      total = await prisma.user.count({ where })
    } else if (type === 'translator') {
      const where: any = {
        role: 'TRANSLATOR',
      }
      if (q) {
        where.OR = [{ username: { contains: q, mode: 'insensitive' } }]
      }
      const result = await prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          avatar: true,
          bio: true,
          role: true,
          level: true,
          translatorProfile: true,
        },
        orderBy: { level: 'desc' },
      })
      data = result
      total = await prisma.user.count({ where })
    } else if (type === 'community') {
      const where: any = { isActive: true }
      if (q) {
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ]
      }
      const result = await prisma.community.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { members: true, messages: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      data = result
      total = await prisma.community.count({ where })
    }

    return NextResponse.json({
      success: true,
      data: {
        results: data,
        type: searchType,
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
