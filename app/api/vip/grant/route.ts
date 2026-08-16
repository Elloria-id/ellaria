import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    const allowedRoles = [
      'FOUNDER',
      'ADMIN',
    ]

    if (
      !allowedRoles.includes(
        session.user.role as string
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tidak memiliki izin',
        },
        { status: 403 }
      )
    }

    const body = await req.json()

    const userId = body?.userId
    const planId = body?.planId

    if (!userId || !planId) {
      return NextResponse.json(
        {
          success: false,
          message: 'userId dan planId wajib diisi',
        },
        { status: 400 }
      )
    }

    const [user, plan] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
      }),
      prisma.vIPPlan.findUnique({
        where: { id: planId },
      }),
    ])

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User tidak ditemukan',
        },
        { status: 404 }
      )
    }

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'Paket VIP tidak ditemukan',
        },
        { status: 404 }
      )
    }

    const now = new Date()

    const existing = await prisma.userVIP.findUnique({
      where: {
        userId,
      },
    })

    const startDate =
      existing && existing.expiresAt > now
        ? existing.expiresAt
        : now

    const expiresAt = new Date(startDate)

    expiresAt.setDate(
      expiresAt.getDate() + plan.days
    )

    const vip = await prisma.userVIP.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        planId,
        startedAt: now,
        expiresAt,
        autoRenew: false,
      },
      update: {
        planId,
        startedAt:
          existing &&
          existing.expiresAt > now
            ? existing.startedAt
            : now,
        expiresAt,
        autoRenew: false,
      },
      include: {
        plan: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'VIP berhasil diberikan',
      data: vip,
    })
  } catch (error) {
    console.error('POST /api/vip/grant:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal memberikan VIP',
      },
      { status: 500 }
    )
  }
}
