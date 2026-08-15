import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { Role } from '@prisma/client'
import { z } from 'zod'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Number(url.searchParams.get('limit')) || 20
    const search = url.searchParams.get('search') || ''
    const role = url.searchParams.get('role')

    const where: any = {}
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (role) {
      where.role = role
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          bio: true,
          role: true,
          coins: true,
          exp: true,
          level: true,
          isBanned: true,
          createdAt: true,
          lastActiveAt: true,
          _count: {
            select: {
              series: true,
              comments: true,
              bookmarks: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

const updateUserSchema = z.object({
  userId: z.string(),
  role: z.enum([Role.USER, Role.TRANSLATOR, Role.CREATOR, Role.MODERATOR, Role.ADMIN, Role.FOUNDER]).optional(),
  isBanned: z.boolean().optional(),
})

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = updateUserSchema.parse(body)

    // Founder protection
    const targetUser = await prisma.user.findUnique({
      where: { id: validated.userId },
      select: { role: true },
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Founder cannot be modified by Admin
    if (targetUser.role === Role.FOUNDER && session.user.role !== Role.FOUNDER) {
      return NextResponse.json(
        { success: false, message: 'Tidak dapat mengubah Founder' },
        { status: 403 }
      )
    }

    // Admin cannot demote Founder
    if (validated.role === Role.USER && targetUser.role === Role.FOUNDER && session.user.role !== Role.FOUNDER) {
      return NextResponse.json(
        { success: false, message: 'Tidak dapat mendemote Founder' },
        { status: 403 }
      )
    }

    const updated = await prisma.user.update({
      where: { id: validated.userId },
      data: {
        ...(validated.role && { role: validated.role }),
        ...(validated.isBanned !== undefined && { isBanned: validated.isBanned }),
      },
      select: {
        id: true,
        username: true,
        role: true,
        isBanned: true,
      },
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_UPDATE',
        targetId: validated.userId,
        targetType: 'USER',
        details: {
          changes: {
            role: validated.role,
            isBanned: validated.isBanned,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
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
