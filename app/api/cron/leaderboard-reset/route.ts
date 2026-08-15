import { NextResponse } from 'next/server'
import { LeaderboardService } from '@/lib/leaderboard/leaderboard.service'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await LeaderboardService.calculateAndResetLeaderboard()

    return NextResponse.json({
      success: true,
      message: 'Leaderboard reset completed',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
