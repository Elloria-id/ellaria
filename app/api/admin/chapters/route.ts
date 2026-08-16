import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { Role, Prisma } from '@prisma/client'

async function requireAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) return false

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      isBanned: true,
    },
  })

  return Boolean(user && !user.isBanned && (user.role === Role.ADMIN || user.role === Role.FOUNDER))
}

export async function GET(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ success: false, message: 'Tidak memiliki akses' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)

    const seriesId = searchParams.get('seriesId') || ''
    const search = searchParams.get('search')?.trim() || ''

    const where: Prisma.ChapterWhereInput = {}

    if (seriesId) {
      where.seriesId = seriesId
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    const chapters = await prisma.chapter.findMany({
      where,
      orderBy: {
        chapterNumber: 'asc',
      },
      include: {
        series: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: chapters })
  } catch (error) {
    console.error('ADMIN CHAPTERS GET ERROR:', error)
    return NextResponse.json({ success: false, message: 'Gagal mengambil chapter' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ success: false, message: 'Tidak memiliki akses' }, { status: 403 })
    }

    const body = await req.json()

    const seriesId = String(body.seriesId || '')
    const chapterNumber = Number(body.chapterNumber ?? body.number)
    const title = String(body.title || '').trim()
    const coinPrice = Math.max(Number(body.coinPrice || 0), 0)

    if (!seriesId || !title || !Number.isFinite(chapterNumber)) {
      return NextResponse.json({ success: false, message: 'Series, nomor chapter, dan title wajib diisi' }, { status: 400 })
    }

    const series = await prisma.series.findUnique({ where: { id: seriesId } })
    if (!series) return NextResponse.json({ success: false, message: 'Series tidak ditemukan' }, { status: 404 })

    const chapter = await prisma.chapter.create({
      data: {
        seriesId,
        chapterNumber,
        title,
        coinPrice,
      },
    })

    return NextResponse.json({ success: true, message: 'Chapter berhasil dibuat', data: chapter }, { status: 201 })
  } catch (error) {
    console.error('ADMIN CHAPTERS POST ERROR:', error)
    return NextResponse.json({ success: false, message: 'Gagal membuat chapter' }, { status: 500 })
  }
}
