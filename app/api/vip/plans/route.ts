import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    const plans = await prisma.vIPPlan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        days: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: plans,
    })
  } catch (error) {
    console.error('GET /api/vip/plans:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil paket VIP',
      },
      { status: 500 }
    )
  }
}
