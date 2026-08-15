import { prisma } from '@/lib/db/prisma'

export class AuditService {
  static async log(
    userId: string,
    action: string,
    targetId?: string,
    targetType?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          targetId,
          targetType,
          details,
          ipAddress,
          userAgent,
        },
      })
    } catch (error) {
      // Audit log failure shouldn't break the main flow
      console.error('Audit log failed:', error)
    }
  }

  static async getLogs(
    page = 1,
    limit = 50,
    userId?: string,
    action?: string
  ) {
    const where: any = {}
    if (userId) where.userId = userId
    if (action) where.action = action

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }
}
