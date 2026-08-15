import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const series = await prisma.series.findUnique({
      where: { slug: params.slug, published: true },
      include: {
        genres: { include: { genre: true } },
        chapters: {
          where: { isPublished: true },
          orderBy: { chapterNumber: 'desc' },
          include: {
            images: { take: 1 },
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

    await prisma.series.update({
      where: { id: series.id },
      data: { views: { increment: 1 } },
    })

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
