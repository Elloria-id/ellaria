import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'

const followSchema = z.object({
  targetId: z.string(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = followSchema.parse(body)

    if (validated.targetId === session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Tidak bisa follow diri sendiri' },
        { status: 400 }
      )
    }

    const target = await prisma.user.findUnique({
      where: { id: validated.targetId },
    })

    if (!target) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    const follow = await prisma.$transaction(async (tx) => {
      const existing = await tx.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: validated.targetId,
          },
        },
      })

      if (existing) {
        throw new Error('Sudah mengikuti')
      }

      const newFollow = await tx.follow.create({
        data: {
          followerId: session.user.id,
          followingId: validated.targetId,
        },
      })

      await tx.user.update({
        where: { id: session.user.id },
        data: { followingCount: { increment: 1 } },
      })

      await tx.user.update({
        where: { id: validated.targetId },
        data: { followersCount: { increment: 1 } },
      })

      await tx.notification.create({
        data: {
          userId: validated.targetId,
          type: 'FOLLOW',
          title: 'Pengikut Baru',
          message: `${session.user.username} mulai mengikuti Anda`,
        },
      })

      return newFollow
    })

    return NextResponse.json({
      success: true,
      data: follow,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Input tidak valid' },
        { status: 400 }
      )
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const targetId = url.searchParams.get('targetId')

    if (!targetId) {
      return NextResponse.json(
        { success: false, message: 'targetId diperlukan' },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.follow.delete({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: targetId,
          },
        },
      })

      await tx.user.update({
        where: { id: session.user.id },
        data: { followingCount: { decrement: 1 } },
      })

      await tx.user.update({
        where: { id: targetId },
        data: { followersCount: { decrement: 1 } },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Berhenti mengikuti',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const type = url.searchParams.get('type') || 'following'
    const userId = url.searchParams.get('userId') || session.user.id

    if (type === 'following') {
      const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              avatar: true,
              level: true,
            },
          },
        },
      })
      return NextResponse.json({
        success: true,
        data: follows.map(f => f.following),
      })
    } else {
      const follows = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              avatar: true,
              level: true,
            },
          },
        },
      })
      return NextResponse.json({
        success: true,
        data: follows.map(f => f.follower),
      })
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
