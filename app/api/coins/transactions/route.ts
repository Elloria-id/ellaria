import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url)

    const pageParam = Number(searchParams.get('page') || '1')
    const limitParam = Number(searchParams.get('limit') || '20')

    const page = Math.max(1, pageParam)
    const limit = Math.min(Math.max(1, limitParam), 50)
    const skip = (page - 1) * limit

    const [transactions, total] = await prisma.$transaction([
      prisma.coinTransaction.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),

      prisma.coinTransaction.count({
        where: {
          userId: session.user.id,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/coins/transactions error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil riwayat transaksi',
      },
      { status: 500 }
    )
  }
}
