import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

const createImageSchema = z.object({
  storageKey: z.string().min(1),
  url: z.string().url().optional().nullable(),
  pageNumber: z.number().int().positive(),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
})

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (
      !session ||
      !['ADMIN', 'FOUNDER'].includes(session.user.role)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    const chapter = await prisma.chapter.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        seriesId: true,
      },
    })

    if (!chapter) {
      return NextResponse.json(
        {
          success: false,
          message: 'Chapter tidak ditemukan',
        },
        { status: 404 }
      )
    }

    const images = await prisma.chapterImage.findMany({
      where: {
        chapterId: params.id,
      },
      orderBy: {
        pageNumber: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: images,
    })
  } catch (error) {
    console.error('GET chapter images error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil gambar chapter',
      },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (
      !session ||
      !['ADMIN', 'FOUNDER'].includes(session.user.role)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    const chapter = await prisma.chapter.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
      },
    })

    if (!chapter) {
      return NextResponse.json(
        {
          success: false,
          message: 'Chapter tidak ditemukan',
        },
        { status: 404 }
      )
    }

    const body = await req.json()
    const validated = createImageSchema.parse(body)

    const image = await prisma.chapterImage.upsert({
      where: {
        chapterId_pageNumber: {
          chapterId: params.id,
          pageNumber: validated.pageNumber,
        },
      },
      update: {
        storageKey: validated.storageKey,
        url: validated.url ?? null,
        width: validated.width ?? null,
        height: validated.height ?? null,
      },
      create: {
        chapterId: params.id,
        pageNumber: validated.pageNumber,
        storageKey: validated.storageKey,
        url: validated.url ?? null,
        width: validated.width ?? null,
        height: validated.height ?? null,
      },
    })

    return NextResponse.json({
      success: true,
      data: image,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Data gambar tidak valid',
          errors: error.flatten(),
        },
        { status: 400 }
      )
    }

    console.error('POST chapter image error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menyimpan gambar chapter',
      },
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

    if (
      !session ||
      !['ADMIN', 'FOUNDER'].includes(session.user.role)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    const body = await req.json()

    const schema = z.object({
      pageNumber: z.number().int().positive().optional(),
      imageId: z.string().min(1).optional(),
    })

    const validated = schema.parse(body)

    if (!validated.pageNumber && !validated.imageId) {
      return NextResponse.json(
        {
          success: false,
          message: 'pageNumber atau imageId wajib diisi',
        },
        { status: 400 }
      )
    }

    const image = await prisma.chapterImage.findFirst({
      where: {
        chapterId: params.id,
        ...(validated.imageId
          ? { id: validated.imageId }
          : { pageNumber: validated.pageNumber }),
      },
    })

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          message: 'Gambar tidak ditemukan',
        },
        { status: 404 }
      )
    }

    await prisma.chapterImage.delete({
      where: {
        id: image.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Gambar chapter dihapus',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Data tidak valid',
        },
        { status: 400 }
      )
    }

    console.error('DELETE chapter image error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menghapus gambar chapter',
      },
      { status: 500 }
    )
  }
}
