import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { WalletService } from '@/lib/coins/wallet.service'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Number(url.searchParams.get('limit')) || 50

    const result = await WalletService.getTransactions(session.user.id, page, limit)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
