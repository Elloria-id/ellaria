import { prisma } from '@/lib/db/prisma'
import { addDays } from 'date-fns'

export class LeaderboardService {
  static async calculateAndResetLeaderboard() {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    await prisma.$transaction(async (tx) => {
      // Reset old entries
      await tx.leaderboardEntry.deleteMany({})

      // Calculate reader leaderboard (based on EXP gained in last 7 days)
      const readers = await tx.user.findMany({
        where: {
          updatedAt: { gte: weekAgo },
        },
        select: {
          id: true,
          username: true,
          avatar: true,
          exp: true,
        },
        orderBy: { exp: 'desc' },
        take: 100,
      })

      // Create entries
      const entries = readers.map((user, index) => ({
        leaderboardId: 'reader',
        userId: user.id,
        score: user.exp,
        rank: index + 1,
      }))

      await tx.leaderboardEntry.createMany({
        data: entries,
      })

      // Reward top 3
      const topUsers = entries.slice(0, 3)
      const rewards = [
        { planId: 'vip-60-days', days: 60 },
        { planId: 'vip-30-days', days: 30 },
        { planId: 'vip-7-days', days: 7 },
      ]

      for (let i = 0; i < topUsers.length; i++) {
        const plan = await tx.vIPPlan.findFirst({
          where: { id: rewards[i].planId },
        })

        if (plan) {
          await tx.userVIP.create({
            data: {
              userId: topUsers[i].userId,
              planId: plan.id,
              startedAt: now,
              expiresAt: addDays(now, rewards[i].days),
            },
          })

          await tx.notification.create({
            data: {
              userId: topUsers[i].userId,
              type: 'LEADERBOARD_REWARD',
              title: 'Leaderboard Reward',
              message: `Selamat! Anda berada di posisi #${i + 1} dan mendapatkan VIP ${rewards[i].days} hari!`,
            },
          })
        }
      }
    })
  }

  static async getLeaderboard(category: string, limit = 20) {
    return await prisma.leaderboardEntry.findMany({
      where: { leaderboardId: category },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            level: true,
          },
        },
      },
      orderBy: { rank: 'asc' },
      take: limit,
    })
  }

  static async getUserRank(userId: string, category: string) {
    const entry = await prisma.leaderboardEntry.findFirst({
      where: {
        leaderboardId: category,
        userId,
      },
    })
    return entry?.rank || null
  }
}
