import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { Role } from '@prisma/client'

async function requireAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) return false

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      isBanned: true,
    },
  })

  return !!(
    user &&
    !user.isBanned &&
    [Role.ADMIN, Role.FOUNDER].includes(user.role)
  )
}

export async function GET(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, message: 'Tidak memiliki akses' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)

    const search = searchParams.get('search')?.trim() || ''
    const type = searchParams.get('type') || ''
    const page = Math.max(
      Number(searchParams.get('page') || 1),
      1
    )
    const limit = Math.min(
      Math.max(Number(searchParams.get('limit') || 20), 1),
      100
    )

    const where: any = {}

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          slug: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    if (type) {
      where.type = type
    }

    const [series, total] = await prisma.$transaction([
      prisma.series.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: {
              chapters: true,
              bookmarks: true,
            },
          },
        },
      }),

      prisma.series.count({
        where,
      }),
    ])

    return NextResponse.json({
      success: true,
      data: series,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('ADMIN SERIES GET ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil data series',
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { success: false, message: 'Tidak memiliki akses' },
        { status: 403 }
      )
    }

    const body = await req.json()

    const title = String(body.title || '').trim()
    const slug = String(body.slug || '').trim()
    const type = String(body.type || 'MANHWA')
    const description = String(body.description || '')
    const cover = body.cover
      ? String(body.cover)
      : null

    if (!title || !slug) {
      return NextResponse.json(
        {
          success: false,
          message: 'Title dan slug wajib diisi',
        },
        { status: 400 }
      )
    }

    const existing = await prisma.series.findUnique({
      where: { slug },
    })

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'Slug series sudah digunakan',
        },
        { status: 409 }
      )
    }

    const series = await prisma.series.create({
      data: {
        title,
        slug,
        type,
        description,
        cover,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Series berhasil dibuat',
        data: series,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('ADMIN SERIES POST ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal membuat series',
      },
      { status: 500 }
    )
  }
}
