import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'
import { SeriesType, SeriesStatus, ContentLabel } from '@prisma/client'

const seriesSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  alternativeTitle: z.string().optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  artist: z.string().optional(),
  type: z.enum([SeriesType.MANGA, SeriesType.MANHWA, SeriesType.MANHUA, SeriesType.NOVEL, SeriesType.ONE_SHOT]),
  status: z.enum([SeriesStatus.ONGOING, SeriesStatus.COMPLETED, SeriesStatus.HIATUS]),
  label: z.enum([ContentLabel.NORMAL, ContentLabel.ADULT, ContentLabel.GORE, ContentLabel.PREMIUM]),
  cover: z.string().optional(),
  is18Plus: z.boolean().default(false),
  isPremium: z.boolean().default(false),
  published: z.boolean().default(true),
  genres: z.array(z.string()).optional(),
})

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Number(url.searchParams.get('limit')) || 20
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status')

    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) {
      where.status = status
    }

    const [series, total] = await Promise.all([
      prisma.series.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          genres: { include: { genre: true } },
          _count: {
            select: { chapters: true, bookmarks: true },
          },
        },
        orderBy: { createdAt: 'desc' },
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
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = seriesSchema.parse(body)

    const series = await prisma.series.create({
      data: {
        title: validated.title,
        slug: validated.slug,
        alternativeTitle: validated.alternativeTitle,
        description: validated.description,
        author: validated.author,
        artist: validated.artist,
        type: validated.type,
        status: validated.status,
        label: validated.label,
        cover: validated.cover,
        is18Plus: validated.is18Plus,
        isPremium: validated.isPremium,
        published: validated.published,
      },
    })

    if (validated.genres?.length) {
      await prisma.seriesGenre.createMany({
        data: validated.genres.map((genreId) => ({
          seriesId: series.id,
          genreId,
        })),
      })
    }

    return NextResponse.json({
      success: true,
      data: series,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Input tidak valid' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
