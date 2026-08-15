import { prisma } from '@/lib/db/prisma'
import { WalletService } from '@/lib/coins/wallet.service'

export class MissionService {
  static async checkAndCompleteMissions(userId: string) {
    const userMissions = await prisma.userMission.findMany({
      where: {
        userId,
        completed: false,
        mission: { isActive: true },
      },
      include: { mission: true },
    })

    for (const um of userMissions) {
      if (um.progress >= um.mission.requirement) {
        await prisma.$transaction(async (tx) => {
          await tx.userMission.update({
            where: { id: um.id },
            data: { completed: true, completedAt: new Date() },
          })

          if (um.mission.rewardCoins > 0) {
            await WalletService.addCoinsInTransaction(
              tx,
              userId,
              um.mission.rewardCoins,
              'REWARD',
              um.id,
              `Mission: ${um.mission.title}`
            )
          }

          if (um.mission.rewardExp > 0) {
            await tx.user.update({
              where: { id: userId },
              data: { exp: { increment: um.mission.rewardExp } },
            })
          }

          if (um.mission.rewardItem) {
            await tx.userInventory.create({
              data: {
                userId,
                itemId: um.mission.rewardItem,
              },
            })
          }

          await tx.notification.create({
            data: {
              userId,
              type: 'MISSION_COMPLETED',
              title: 'Misi Selesai',
              message: `Anda menyelesaikan misi: ${um.mission.title}`,
            },
          })
        })
      }
    }
  }

  static async updateProgress(userId: string, missionType: string, increment = 1) {
    const missions = await prisma.mission.findMany({
      where: {
        type: missionType,
        isActive: true,
      },
    })

    for (const mission of missions) {
      const userMission = await prisma.userMission.upsert({
        where: {
          userId_missionId: {
            userId,
            missionId: mission.id,
          },
        },
        update: {
          progress: { increment },
        },
        create: {
          userId,
          missionId: mission.id,
          progress: increment,
        },
      })

      if (userMission.progress >= mission.requirement) {
        // Will be handled by checkAndCompleteMissions
      }
    }
  }
}
