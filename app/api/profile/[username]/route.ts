import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface Context {
  params: {
    username: string
  }
}

export async function GET(
  _req: Request,
  { params }: Context
) {
  try {
    const user =
      await prisma.user.findUnique({
        where: {
          username: params.username,
        },
        select: {
          id: true,
          username: true,
          avatar: true,
          bio: true,
          role: true,
          exp: true,
          level: true,
          followersCount: true,
          followingCount: true,
          createdAt: true,
          creatorProfile: true,
          translatorProfile: true,
          badges: {
            include: {
              badge: true,
            },
          },
          titles: {
            where: {
              isActive: true,
            },
            include: {
              title: true,
            },
          },
          frames: {
            where: {
              isActive: true,
            },
            include: {
              frame: true,
            },
          },
        },
      })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User tidak ditemukan',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error(
      'GET /api/profile/[username]:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil profile',
      },
      { status: 500 }
    )
  }
}
