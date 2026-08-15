import { prisma } from '@/lib/db/prisma'
import { addDays } from 'date-fns'

export class VIPService {
  static async getActiveVIP(userId: string) {
    return await prisma.userVIP.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      include: { plan: true },
    })
  }

  static async isVIP(userId: string): Promise<boolean> {
    const vip = await this.getActiveVIP(userId)
    return !!vip
  }

  static async grantVIP(
    userId: string,
    planId: string,
    grantedBy?: string
  ) {
    const plan = await prisma.vIPPlan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      throw new Error('VIP plan tidak ditemukan')
    }

    return await prisma.$transaction(async (tx) => {
      await tx.userVIP.updateMany({
        where: {
          userId,
          expiresAt: { gt: new Date() },
        },
        data: { expiresAt: new Date() },
      })

      const vip = await tx.userVIP.create({
        data: {
          userId,
          planId,
          startedAt: new Date(),
          expiresAt: addDays(new Date(), plan.days),
        },
      })

      await tx.notification.create({
        data: {
          userId,
          type: 'VIP_ACTIVATED',
          title: 'VIP Diaktifkan',
          message: `Anda telah mendapatkan VIP ${plan.name}`,
        },
      })

      return vip
    })
  }

  static async getBenefits(userId: string) {
    const vip = await this.getActiveVIP(userId)
    if (!vip) return null

    return {
      plan: vip.plan,
      startedAt: vip.startedAt,
      expiresAt: vip.expiresAt,
      daysRemaining: Math.ceil(
        (vip.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      ),
    }
  }

  static async expireVIP(userId: string) {
    await prisma.userVIP.updateMany({
      where: {
        userId,
        expiresAt: { lte: new Date() },
      },
      data: { expiresAt: new Date() },
    })
  }
}
