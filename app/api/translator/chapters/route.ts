import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'

const chapterSchema = z.object({
  seriesId: z.string(),
  chapterNumber: z.number(),
  title: z.string().optional(),
  content: z.string().optional(), // Untuk novel
  images: z.array(z.string()).optional(), // Untuk manga
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!['TRANSLATOR', 'ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validated = chapterSchema.parse(body)

    // Verify ownership
    const series = await prisma.series.findUnique({
      where: { id: validated.seriesId },
    })

    if (!series) {
      return NextResponse.json(
        { success: false, message: 'Series tidak ditemukan' },
        { status: 404 }
      )
    }

    if (series.ownerId !== session.user.id && !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - bukan pemilik series' },
        { status: 403 }
      )
    }

    const chapter = await prisma.chapter.create({
      data: {
        seriesId: validated.seriesId,
        chapterNumber: validated.chapterNumber,
        title: validated.title,
        contentType: validated.content ? 'NOVEL' : 'IMAGE',
        isPublished: false,
      },
    })

    // Handle images jika ada
    if (validated.images?.length) {
      await prisma.chapterImage.createMany({
        data: validated.images.map((url, index) => ({
          chapterId: chapter.id,
          pageNumber: index + 1,
          storageKey: url,
          url,
        })),
      })
    }

    // Handle novel content
    if (validated.content) {
      await prisma.chapterImage.create({
        data: {
          chapterId: chapter.id,
          pageNumber: 1,
          storageKey: `novel/${validated.seriesId}/${chapter.chapterNumber}`,
          url: validated.content,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: chapter,
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
