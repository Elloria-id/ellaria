import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Anda harus login' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const followingId = body.followingId

    if (!followingId || typeof followingId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'followingId diperlukan' },
        { status: 400 }
      )
    }

    if (followingId === session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Tidak dapat mengikuti diri sendiri' },
        { status: 400 }
      )
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
      select: {
        id: true,
        username: true,
        isBanned: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    if (targetUser.isBanned) {
      return NextResponse.json(
        { success: false, message: 'User tidak dapat diikuti' },
        { status: 400 }
      )
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId,
        },
      },
    })

    if (existingFollow) {
      return NextResponse.json({
        success: true,
        following: false,
        message: `Berhenti mengikuti ${targetUser.username}`,
      })
    }

    await prisma.$transaction([
      prisma.follow.create({
        data: {
          followerId: session.user.id,
          followingId,
        },
      }),

      prisma.user.update({
        where: { id: session.user.id },
        data: {
          followingCount: {
            increment: 1,
          },
        },
      }),

      prisma.user.update({
        where: { id: followingId },
        data: {
          followersCount: {
            increment: 1,
          },
        },
      }),

      prisma.notification.create({
        data: {
          userId: followingId,
          type: 'FOLLOW',
          title: 'Pengikut baru',
          message: `${session.user.username ?? 'Seseorang'} mulai mengikuti Anda`,
          data: {
            followerId: session.user.id,
            followerUsername: session.user.username ?? null,
          },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      following: true,
      message: `Sekarang mengikuti ${targetUser.username}`,
    })
  } catch (error) {
    console.error('FOLLOW_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengikuti user',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Anda harus login' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const followingId = body.followingId

    if (!followingId || typeof followingId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'followingId diperlukan' },
        { status: 400 }
      )
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId,
        },
      },
    })

    if (!existingFollow) {
      return NextResponse.json({
        success: true,
        following: false,
        message: 'Belum mengikuti user tersebut',
      })
    }

    await prisma.$transaction([
      prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId,
          },
        },
      }),

      prisma.user.update({
        where: { id: session.user.id },
        data: {
          followingCount: {
            decrement: 1,
          },
        },
      }),

      prisma.user.update({
        where: { id: followingId },
        data: {
          followersCount: {
            decrement: 1,
          },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      following: false,
      message: 'Berhenti mengikuti user',
    })
  } catch (error) {
    console.error('UNFOLLOW_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal berhenti mengikuti user',
      },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Anda harus login' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId diperlukan' },
        { status: 400 }
      )
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId,
        },
      },
    })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        followersCount: true,
        followingCount: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      following: !!follow,
      user,
    })
  } catch (error) {
    console.error('FOLLOW_STATUS_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil status follow',
      },
      { status: 500 }
    )
  }
}
