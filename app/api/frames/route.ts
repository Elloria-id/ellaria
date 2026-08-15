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

    const frames = await prisma.userAvatarFrame.findMany({
      where: { userId: session.user.id },
      include: { frame: true },
      orderBy: { awardedAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: frames,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { frameId } = body

    if (!frameId) {
      return NextResponse.json(
        { success: false, message: 'frameId diperlukan' },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.userAvatarFrame.updateMany({
        where: { userId: session.user.id },
        data: { isActive: false },
      })

      await tx.userAvatarFrame.update({
        where: {
          userId_frameId: {
            userId: session.user.id,
            frameId,
          },
        },
        data: { isActive: true },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Frame diaktifkan',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
