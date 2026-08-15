import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()

    // Find expired VIPs
    const expiredVIPs = await prisma.userVIP.findMany({
      where: {
        expiresAt: { lte: now },
      },
      include: {
        user: true,
      },
    })

    // Notify users
    for (const vip of expiredVIPs) {
      await prisma.notification.create({
        data: {
          userId: vip.userId,
          type: 'VIP_EXPIRED',
          title: 'VIP Berakhir',
          message: 'Masa VIP Anda telah berakhir. Perpanjang sekarang untuk mendapatkan kembali akses eksklusif.',
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${expiredVIPs.length} expired VIPs`,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
