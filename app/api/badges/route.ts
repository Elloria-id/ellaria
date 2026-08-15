import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const badges = await prisma.userBadge.findMany({
      where: { userId: session.user.id },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: badges,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Hanya ADMIN dan FOUNDER yang bisa grant badge
    if (!['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { userId, badgeId } = body

    if (!userId || !badgeId) {
      return NextResponse.json(
        { success: false, message: 'userId dan badgeId diperlukan' },
        { status: 400 }
      )
    }

    const badge = await prisma.badge.findUnique({
      where: { id: badgeId },
    })

    if (!badge) {
      return NextResponse.json(
        { success: false, message: 'Badge tidak ditemukan' },
        { status: 404 }
      )
    }

    const userBadge = await prisma.userBadge.upsert({
      where: {
        userId_badgeId: {
          userId,
          badgeId,
        },
      },
      update: {},
      create: {
        userId,
        badgeId,
      },
    })

    return NextResponse.json({
      success: true,
      data: userBadge,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
