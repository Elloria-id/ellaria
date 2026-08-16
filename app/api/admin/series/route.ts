import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { Role } from '@prisma/client'

async function checkAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { session: null, allowed: false }
  }

  return {
    session,
    allowed:
      session.user.role === Role.ADMIN ||
      session.user.role === Role.FOUNDER,
  }
}

export async function GET(req: Request) {
  try {
    const { session, allowed } = await checkAdmin()

    if (!session || !allowed) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const page = Math.max(
      Number(searchParams.get('page') || 1),
      1
    )
    const limit = Math.min(
      Math.max(Number(searchParams.get('limit') || 20), 1),
      100
    )

    const where = search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
            {
              slug: {
                contains: search,
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {}

    const [series, total] = await prisma.$transaction([
      prisma.series.findMany({
        where,
        include: {
          _count: {
            select: {
              chapters: true,
              bookmarks: true,
              comments: true,
            },
          },
          genres: {
            include: {
              genre: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.series.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      series,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('ADMIN_SERIES_GET_ERROR:', error)

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
    const { session, allowed } = await checkAdmin()

    if (!session || !allowed) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak' },
        { status: 403 }
      )
    }

    const body = await req.json()

    const title = String(body.title || '').trim()
    const slug = String(body.slug || '').trim()
    const type = body.type || 'MANGA'

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
          message: 'Slug sudah digunakan',
        },
        { status: 409 }
      )
    }

    const series = await prisma.series.create({
      data: {
        title,
        slug,
        alternativeTitle: body.alternativeTitle || null,
        description: body.description || null,
        cover: body.cover || null,
        author: body.author || null,
        artist: body.artist || null,
        type,
        status: body.status || 'ONGOING',
        label: body.label || 'NORMAL',
        is18Plus: Boolean(body.is18Plus),
        isPremium: Boolean(body.isPremium),
        contentWarning: body.contentWarning || null,
        published:
          body.published === undefined
            ? true
            : Boolean(body.published),
        ownerId: body.ownerId || null,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_CREATE_SERIES',
        targetId: series.id,
        targetType: 'SERIES',
        details: {
          title: series.title,
          slug: series.slug,
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Series berhasil dibuat',
        series,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('ADMIN_SERIES_POST_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal membuat series',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const { session, allowed } = await checkAdmin()

    if (!session || !allowed) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const id = body.id

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID series diperlukan',
        },
        { status: 400 }
      )
    }

    const existing = await prisma.series.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'Series tidak ditemukan',
        },
        { status: 404 }
      )
    }

    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await prisma.series.findUnique({
        where: { slug: body.slug },
      })

      if (slugExists) {
        return NextResponse.json(
          {
            success: false,
            message: 'Slug sudah digunakan',
          },
          { status: 409 }
        )
      }
    }

    const series = await prisma.series.update({
      where: { id },
      data: {
        ...(body.title !== undefined && {
          title: String(body.title).trim(),
        }),
        ...(body.slug !== undefined && {
          slug: String(body.slug).trim(),
        }),
        ...(body.alternativeTitle !== undefined && {
          alternativeTitle: body.alternativeTitle || null,
        }),
        ...(body.description !== undefined && {
          description: body.description || null,
        }),
        ...(body.cover !== undefined && {
          cover: body.cover || null,
        }),
        ...(body.author !== undefined && {
          author: body.author || null,
        }),
        ...(body.artist !== undefined && {
          artist: body.artist || null,
        }),
        ...(body.type !== undefined && {
          type: body.type,
        }),
        ...(body.status !== undefined && {
          status: body.status,
        }),
        ...(body.label !== undefined && {
          label: body.label,
        }),
        ...(body.is18Plus !== undefined && {
          is18Plus: Boolean(body.is18Plus),
        }),
        ...(body.isPremium !== undefined && {
          isPremium: Boolean(body.isPremium),
        }),
        ...(body.contentWarning !== undefined && {
          contentWarning: body.contentWarning || null,
        }),
        ...(body.published !== undefined && {
          published: Boolean(body.published),
        }),
        ...(body.ownerId !== undefined && {
          ownerId: body.ownerId || null,
        }),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_UPDATE_SERIES',
        targetId: id,
        targetType: 'SERIES',
        details: {
          title: series.title,
          slug: series.slug,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Series berhasil diperbarui',
      series,
    })
  } catch (error) {
    console.error('ADMIN_SERIES_PATCH_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal memperbarui series',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { session, allowed } = await checkAdmin()

    if (!session || !allowed) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const id = body.id

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID series diperlukan',
        },
        { status: 400 }
      )
    }

    const series = await prisma.series.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    })

    if (!series) {
      return NextResponse.json(
        {
          success: false,
          message: 'Series tidak ditemukan',
        },
        { status: 404 }
      )
    }

    await prisma.series.delete({
      where: { id },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_DELETE_SERIES',
        targetId: id,
        targetType: 'SERIES',
        details: {
          title: series.title,
          slug: series.slug,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Series berhasil dihapus',
    })
  } catch (error) {
    console.error('ADMIN_SERIES_DELETE_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menghapus series',
      },
      { status: 500 }
    )
  }
}
