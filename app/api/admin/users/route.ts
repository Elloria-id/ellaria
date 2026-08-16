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

  const role = session.user.role

  return {
    session,
    allowed: role === Role.ADMIN || role === Role.FOUNDER,
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
    const role = searchParams.get('role') as Role | null
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

    if (role && Object.values(Role).includes(role)) {
      where.role = role
    }

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
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
          followersCount: true,
          followingCount: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('ADMIN_USERS_GET_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil data user',
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

    const userId = body.userId
    const action = body.action

    if (!userId || !action) {
      return NextResponse.json(
        {
          success: false,
          message: 'userId dan action diperlukan',
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

    // Founder tidak boleh diubah atau diblokir
    if (
      targetUser.role === Role.FOUNDER &&
      session.user.role !== Role.FOUNDER
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Admin tidak dapat mengubah akun Founder',
        },
        { status: 403 }
      )
    }

    // Founder juga tidak boleh diblokir
    if (
      targetUser.role === Role.FOUNDER &&
      ['BAN', 'UNBAN', 'DELETE'].includes(action)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Akun Founder dilindungi',
        },
        { status: 403 }
      )
    }

    if (
      targetUser.id === session.user.id &&
      ['BAN', 'DELETE', 'ROLE'].includes(action)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tidak dapat melakukan tindakan ini pada akun sendiri',
        },
        { status: 400 }
      )
    }

    let updatedUser

    switch (action) {
      case 'BAN':
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            isBanned: true,
          },
          select: {
            id: true,
            username: true,
            role: true,
            isBanned: true,
          },
        })
        break

      case 'UNBAN':
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            isBanned: false,
          },
          select: {
            id: true,
            username: true,
            role: true,
            isBanned: true,
          },
        })
        break

      case 'ROLE': {
        const newRole = body.role as Role

        if (!Object.values(Role).includes(newRole)) {
          return NextResponse.json(
            {
              success: false,
              message: 'Role tidak valid',
            },
            { status: 400 }
          )
        }

        // Hanya Founder yang boleh memberikan / mengubah role Founder
        if (
          newRole === Role.FOUNDER &&
          session.user.role !== Role.FOUNDER
        ) {
          return NextResponse.json(
            {
              success: false,
              message: 'Hanya Founder yang dapat memberikan role Founder',
            },
            { status: 403 }
          )
        }

        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            role: newRole,
          },
          select: {
            id: true,
            username: true,
            role: true,
            isBanned: true,
          },
        })

        break
      }

      case 'COINS': {
        const amount = Number(body.amount)

        if (!Number.isInteger(amount)) {
          return NextResponse.json(
            {
              success: false,
              message: 'Jumlah coin harus berupa angka bulat',
            },
            { status: 400 }
          )
        }

        updatedUser = await prisma.$transaction(async tx => {
          const user = await tx.user.update({
            where: { id: userId },
            data: {
              coins: {
                increment: amount,
              },
            },
            select: {
              id: true,
              username: true,
              role: true,
              coins: true,
              isBanned: true,
            },
          })

          await tx.coinWallet.upsert({
            where: {
              userId,
            },
            create: {
              userId,
              balance: Math.max(amount, 0),
            },
            update: {
              balance: {
                increment: amount,
              },
            },
          })

          await tx.coinTransaction.create({
            data: {
              userId,
              type: 'ADMIN_GRANT',
              amount,
              balance: user.coins,
              description:
                amount >= 0
                  ? `Admin memberikan ${amount} coin`
                  : `Admin mengurangi ${Math.abs(amount)} coin`,
            },
          })

          return user
        })

        break
      }

      default:
        return NextResponse.json(
          {
            success: false,
            message: 'Action tidak dikenal',
          },
          { status: 400 }
        )
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: `ADMIN_USER_${action}`,
        targetId: userId,
        targetType: 'USER',
        details: {
          username: targetUser.username,
          action,
          role: body.role ?? null,
          amount: body.amount ?? null,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Data user berhasil diperbarui',
      user: updatedUser,
    })
  } catch (error) {
    console.error('ADMIN_USERS_PATCH_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal memperbarui user',
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
    const userId = body.userId

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'userId diperlukan',
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

    if (targetUser.role === Role.FOUNDER) {
      return NextResponse.json(
        {
          success: false,
          message: 'Akun Founder tidak dapat dihapus',
        },
        { status: 403 }
      )
    }

    if (targetUser.id === session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tidak dapat menghapus akun sendiri',
        },
        { status: 400 }
      )
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADMIN_DELETE_USER',
        targetId: userId,
        targetType: 'USER',
        details: {
          username: targetUser.username,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User berhasil dihapus',
    })
  } catch (error) {
    console.error('ADMIN_USERS_DELETE_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menghapus user',
      },
      { status: 500 }
    )
  }
}
