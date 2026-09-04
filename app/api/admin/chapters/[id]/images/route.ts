import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { Role } from '@prisma/client'
import type { Prisma } from '@prisma/client'

import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { getStorageProvider } from '@/lib/storage/provider'

const imageUrlSchema = z
  .string()
  .min(1)
  .refine(
    value =>
      value.startsWith('/') ||
      value.startsWith('https://') ||
      value.startsWith('http://'),
    'URL gambar tidak valid'
  )

const createImageSchema = z.object({
  storageKey: z.string().min(1).startsWith('chapters/'),
  url: imageUrlSchema.optional().nullable(),
  pageNumber: z.number().int().positive(),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
})

const reorderImagesSchema = z.object({
  pages: z
    .array(
      z.object({
        id: z.string().min(1),
        pageNumber: z.number().int().positive(),
      })
    )
    .min(1),
})

type ImageRouteContext = {
  params: Promise<{ id: string }>
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return false

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBanned: true },
  })

  return Boolean(
    user &&
      !user.isBanned &&
      (user.role === Role.ADMIN || user.role === Role.FOUNDER)
  )
}

export async function GET(
  _req: Request,
  { params }: ImageRouteContext
) {
  try {
    const { id } = await params

    if (!(await requireAdmin())) {
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
        id,
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
        chapterId: id,
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
  { params }: ImageRouteContext
) {
  try {
    const { id } = await params

    if (!(await requireAdmin())) {
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
        id,
      },
      select: {
        id: true,
        contentType: true,
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

    if (chapter.contentType.toUpperCase() === 'NOVEL') {
      return NextResponse.json(
        {
          success: false,
          message: 'Chapter novel menggunakan konten teks, bukan halaman gambar',
        },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validated = createImageSchema.parse(body)

    const image = await prisma.chapterImage.upsert({
      where: {
        chapterId_pageNumber: {
          chapterId: id,
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
            chapterId: id,
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
  { params }: ImageRouteContext
) {
  try {
    const { id } = await params

    if (!(await requireAdmin())) {
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
        chapterId: id,
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

    await getStorageProvider().delete(image.storageKey)

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

export async function PATCH(
  req: Request,
  { params }: ImageRouteContext
) {
  try {
    const { id } = await params

    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = reorderImagesSchema.parse(await req.json())
    const pageNumbers = body.pages.map(page => page.pageNumber)

    if (new Set(pageNumbers).size !== pageNumbers.length) {
      return NextResponse.json(
        { success: false, message: 'Nomor halaman tidak boleh duplikat' },
        { status: 400 }
      )
    }

    const chapterImages = await prisma.chapterImage.findMany({
      where: { chapterId: id },
      select: { id: true },
    })
    const existingIds = new Set(
      chapterImages.map((image: (typeof chapterImages)[number]) => image.id)
    )

    if (
      body.pages.length !== chapterImages.length ||
      body.pages.some(page => !existingIds.has(page.id))
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Daftar halaman tidak sesuai dengan chapter',
        },
        { status: 400 }
      )
    }

    const reordered = await prisma.$transaction(
      async (transaction: Prisma.TransactionClient) => {
      for (const [index, page] of body.pages.entries()) {
        await transaction.chapterImage.update({
          where: { id: page.id },
          data: { pageNumber: -(index + 1) },
        })
      }

      for (const page of body.pages) {
        await transaction.chapterImage.update({
          where: { id: page.id },
          data: { pageNumber: page.pageNumber },
        })
      }

      return transaction.chapterImage.findMany({
        where: { chapterId: id },
        orderBy: { pageNumber: 'asc' },
      })
      }
    )

    return NextResponse.json({
      success: true,
      data: reordered,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Data urutan halaman tidak valid' },
        { status: 400 }
      )
    }

    console.error('PATCH chapter images error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal mengubah urutan halaman' },
      { status: 500 }
    )
  }
}
