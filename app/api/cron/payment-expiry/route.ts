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

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() - 7) // 7 days expiry

    const expiredPayments = await prisma.payment.updateMany({
      where: {
        status: 'PENDING',
        createdAt: { lte: expiryDate },
      },
      data: {
        status: 'EXPIRED',
      },
    })

    return NextResponse.json({
      success: true,
      message: `Expired ${expiredPayments.count} pending payments`,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
