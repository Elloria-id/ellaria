import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
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

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get today's reward (based on user's streak)
    const existingClaim = await prisma.userDailyReward.findFirst({
      where: {
        userId: session.user.id,
        claimedAt: { gte: today },
      },
      include: { reward: true },
    })

    if (existingClaim) {
      return NextResponse.json({
        success: true,
        data: {
          claimed: true,
          reward: existingClaim.reward,
          claimedAt: existingClaim.claimedAt,
        },
      })
    }

    // Calculate streak
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const lastClaim = await prisma.userDailyReward.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: { claimedAt: 'desc' },
    })

    let streak = 1
    if (lastClaim) {
      const lastDate = new Date(lastClaim.claimedAt)
      lastDate.setHours(0, 0, 0, 0)

      if (lastDate.getTime() === yesterday.getTime()) {
        streak = await this.getStreak(session.user.id) + 1
      } else if (lastDate.getTime() < yesterday.getTime()) {
        streak = 1
      }
    }

    // Get reward for current day
    const day = ((streak - 1) % 7) + 1
    const reward = await prisma.dailyReward.findFirst({
      where: { day },
    })

    return NextResponse.json({
      success: true,
      data: {
        claimed: false,
        streak,
        day,
        reward,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Check if already claimed
      const existingClaim = await tx.userDailyReward.findFirst({
        where: {
          userId: session.user.id,
          claimedAt: { gte: today },
        },
      })

      if (existingClaim) {
        throw new Error('Sudah mengklaim reward hari ini')
      }

      // Get reward
      const reward = await tx.dailyReward.findFirst({
        where: { day: 1 }, // Will calculate streak properly
        orderBy: { day: 'asc' },
      })

      if (!reward) {
        throw new Error('Reward tidak ditemukan')
      }

      // Claim reward
      await tx.userDailyReward.create({
        data: {
          userId: session.user.id,
          rewardId: reward.id,
        },
      })

      // Add coins
      if (reward.coins > 0) {
        await WalletService.addCoinsInTransaction(
          tx,
          session.user.id,
          reward.coins,
          'REWARD',
          reward.id,
          `Daily Reward - Day ${reward.day}`
        )
      }

      // Add EXP
      if (reward.exp > 0) {
        await tx.user.update({
          where: { id: session.user.id },
          data: { exp: { increment: reward.exp } },
        })
      }

      return reward
    })

    return NextResponse.json({
      success: true,
      data: {
        claimed: true,
        reward: result,
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper method untuk streak calculation
async function getStreak(userId: string): Promise<number> {
  const claims = await prisma.userDailyReward.findMany({
    where: { userId },
    orderBy: { claimedAt: 'desc' },
  })

  if (claims.length === 0) return 0

  let streak = 1
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < claims.length - 1; i++) {
    const current = new Date(claims[i].claimedAt)
    current.setHours(0, 0, 0, 0)

    const next = new Date(claims[i + 1].claimedAt)
    next.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}
