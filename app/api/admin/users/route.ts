import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { Role } from '@prisma/client'

async function checkAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { authorized: false, session: null }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBanned: true },
  })

  if (
    !user ||
    user.isBanned ||
    ![Role.ADMIN, Role.FOUNDER].includes(user.role)
  ) {
    return { authorized: false, session }
  }

  return { authorized: true, session }
}

// GET — daftar user
export async function GET(req: Request) {
  try {
    const auth = await checkAdmin()

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: 'Tidak memiliki akses' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)

    const search = searchParams.get('search')?.trim() || ''
    const role = searchParams.get('role') || ''
    const page = Math.max(
      Number.parseInt(searchParams.get('page') || '1', 10),
      1
    )
    const limit = Math.min(
      Math.max(
        Number.parseInt(searchParams.get('limit') || '20', 10),
        1
      ),
      100
    )

    const where: any = {}

    if (search) {
      where.OR = [
        {
          username: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    if (
      role &&
      Object.values(Role).includes(role as Role)
    ) {
      where.role = role as Role
    }

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          role: true,
          coins: true,
          exp: true,
          level: true,
          isBanned: true,
          show18Plus: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              bookmarks: true,
              comments: true,
              followers: true,
              following: true,
            },
          },
        },
      }),

      prisma.user.count({
        where,
      }),
    ])

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('ADMIN USERS GET ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil data user',
      },
      { status: 500 }
    )
  }
}

// PATCH — ubah role / status ban / data tertentu
export async function PATCH(req: Request) {
  try {
    const auth = await checkAdmin()

    if (!auth.authorized || !auth.session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Tidak memiliki akses' },
        { status: 403 }
      )
    }

    const body = await req.json()

    const userId = String(body.userId || '')
    const newRole = body.role
    const isBanned =
      typeof body.isBanned === 'boolean'
        ? body.isBanned
        : undefined

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'userId wajib diisi',
        },
        { status: 400 }
      )
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        isBanned: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User tidak ditemukan',
        },
        { status: 404 }
      )
    }

    const currentAdmin = await prisma.user.findUnique({
      where: { id: auth.session.user.id },
      select: { role: true },
    })

    // Founder tidak boleh diturunkan oleh ADMIN.
    if (
      targetUser.role === Role.FOUNDER &&
      currentAdmin?.role !== Role.FOUNDER
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Akun Founder tidak dapat diubah oleh Admin',
        },
        { status: 403 }
      )
    }

    // Hanya Founder yang boleh memberikan / mencabut role FOUNDER.
    if (
      newRole === Role.FOUNDER &&
      currentAdmin?.role !== Role.FOUNDER
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Hanya Founder yang dapat mengatur role Founder',
        },
        { status: 403 }
      )
    }

    const updateData: {
      role?: Role
      isBanned?: boolean
    } = {}

    if (
      newRole &&
      Object.values(Role).includes(newRole as Role)
    ) {
      updateData.role = newRole as Role
    }

    if (isBanned !== undefined) {
      updateData.isBanned = isBanned
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tidak ada perubahan',
        },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        role: true,
        coins: true,
        exp: true,
        level: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User berhasil diperbarui',
      data: updatedUser,
    })
  } catch (error) {
    console.error('ADMIN USERS PATCH ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal memperbarui user',
      },
      { status: 500 }
    )
  }
}
