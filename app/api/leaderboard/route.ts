import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { LeaderboardService } from '@/lib/leaderboard/leaderboard.service'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const category = url.searchParams.get('category') || 'reader'
    const limit = Number(url.searchParams.get('limit')) || 20

    const entries = await LeaderboardService.getLeaderboard(category, limit)

    return NextResponse.json({
      success: true,
      data: {
        category,
        entries,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
