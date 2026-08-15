import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'
import { SeriesType, SeriesStatus, ContentLabel } from '@prisma/client'

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  alternativeTitle: z.string().optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  artist: z.string().optional(),
  type: z.enum([SeriesType.MANGA, SeriesType.MANHWA, SeriesType.MANHUA, SeriesType.NOVEL, SeriesType.ONE_SHOT]).optional(),
  status: z.enum([SeriesStatus.ONGOING, SeriesStatus.COMPLETED, SeriesStatus.HIATUS]).optional(),
  label: z.enum([ContentLabel.NORMAL, ContentLabel.ADULT, ContentLabel.GORE, ContentLabel.PREMIUM]).optional(),
  cover: z.string().optional(),
  is18Plus: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  published: z.boolean().optional(),
  genres: z.array(z.string()).optional(),
})

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const series = await prisma.series.findUnique({
      where: { id: params.id },
      include: {
        genres: { include: { genre: true } },
        chapters: {
          orderBy: { chapterNumber: 'desc' },
          include: {
            _count: {
              select: { images: true },
            },
          },
        },
        _count: {
          select: { chapters: true, bookmarks: true },
        },
      },
    })

    if (!series) {
      return NextResponse.json(
        { success: false, message: 'Series tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: series,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = updateSchema.parse(body)

    const series = await prisma.series.update({
      where: { id: params.id },
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

    if (validated.genres) {
      // Remove old genres
      await prisma.seriesGenre.deleteMany({
        where: { seriesId: params.id },
      })

      // Add new genres
      if (validated.genres.length) {
        await prisma.seriesGenre.createMany({
          data: validated.genres.map((genreId) => ({
            seriesId: params.id,
            genreId,
          })),
        })
      }
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Founder protection: can't delete founder's series if not founder
    const series = await prisma.series.findUnique({
      where: { id: params.id },
      include: { owner: true },
    })

    if (series?.owner?.role === 'FOUNDER' && session.user.role !== 'FOUNDER') {
      return NextResponse.json(
        { success: false, message: 'Tidak dapat menghapus series milik Founder' },
        { status: 403 }
      )
    }

    await prisma.series.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Series dihapus',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
