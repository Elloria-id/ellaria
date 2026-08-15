import { prisma } from '@/lib/db/prisma'

export class BruteForceProtection {
  private static readonly MAX_ATTEMPTS = 5
  private static readonly WINDOW_MS = 15 * 60 * 1000 // 15 minutes

  static async checkAttempts(identifier: string): Promise<boolean> {
    const now = new Date()
    const windowStart = new Date(now.getTime() - this.WINDOW_MS)

    const attempts = await prisma.loginAttempt.count({
      where: {
        identifier,
        createdAt: { gte: windowStart },
      },
    })

    return attempts < this.MAX_ATTEMPTS
  }

  static async recordAttempt(identifier: string, success: boolean): Promise<void> {
    if (success) {
      // Clear old attempts on success
      await prisma.loginAttempt.deleteMany({
        where: { identifier },
      })
    } else {
      await prisma.loginAttempt.create({
        data: {
          identifier,
          ipAddress: identifier,
        },
      })
    }
  }

  static async getRemainingAttempts(identifier: string): Promise<number> {
    const now = new Date()
    const windowStart = new Date(now.getTime() - this.WINDOW_MS)

    const attempts = await prisma.loginAttempt.count({
      where: {
        identifier,
        createdAt: { gte: windowStart },
      },
    })

    return Math.max(0, this.MAX_ATTEMPTS - attempts)
  }
}
