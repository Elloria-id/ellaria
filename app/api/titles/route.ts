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

    const titles = await prisma.userTitle.findMany({
      where: { userId: session.user.id },
      include: { title: true },
      orderBy: { awardedAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: titles,
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
    const { titleId } = body

    if (!titleId) {
      return NextResponse.json(
        { success: false, message: 'titleId diperlukan' },
        { status: 400 }
      )
    }

    // Deactivate all, then activate selected
    await prisma.$transaction(async (tx) => {
      await tx.userTitle.updateMany({
        where: { userId: session.user.id },
        data: { isActive: false },
      })

      await tx.userTitle.update({
        where: {
          userId_titleId: {
            userId: session.user.id,
            titleId,
          },
        },
        data: { isActive: true },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Title diaktifkan',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
