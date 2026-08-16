import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
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

    const vip = await prisma.userVIP.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        plan: true,
      },
    })

    if (!vip) {
      return NextResponse.json({
        success: true,
        active: false,
        data: null,
      })
    }

    const now = new Date()
    const active = vip.expiresAt > now

    return NextResponse.json({
      success: true,
      active,
      data: {
        id: vip.id,
        plan: vip.plan,
        startedAt: vip.startedAt,
        expiresAt: vip.expiresAt,
        autoRenew: vip.autoRenew,
      },
    })
  } catch (error) {
    console.error('GET /api/vip/status:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil status VIP',
      },
      { status: 500 }
    )
  }
}
