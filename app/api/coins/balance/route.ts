import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { getCoinBalance } from '@/lib/coins/wallet.service'

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

    const balance = await getCoinBalance(session.user.id)

    return NextResponse.json({
      success: true,
      balance,
    })
  } catch (error) {
    console.error('GET /api/coins/balance error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil saldo coin',
      },
      { status: 500 }
    )
  }
}
