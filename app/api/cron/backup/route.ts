import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Get backup configuration
    const settings = await prisma.siteSetting.findUnique({ where: { key: 'backup_config' } })

    const backupConfig =
      (settings?.value as { enabled: boolean; frequency: 'daily' | 'weekly'; retentionDays: number }) || {
        enabled: true,
        frequency: 'daily',
        retentionDays: 30,
      }

    if (!backupConfig.enabled) {
      return NextResponse.json({ success: true, message: 'Backup disabled' })
    }

    // Generate backup metadata
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      tables: {
        users: await prisma.user.count(),
        series: await prisma.series.count(),
        chapters: await prisma.chapter.count(),
        payments: await prisma.payment.count(),
        transactions: await prisma.coinTransaction.count(),
      },
      settings: backupConfig,
    }

    // Store backup metadata in database (optional)
    await prisma.backupRecord.create({
      data: {
        key: `backup-${Date.now()}`,
        path: '/backups',
        meta: backup,
      },
    })

    return NextResponse.json({ success: true, data: backup })
  } catch (error) {
    console.error('BACKUP ERROR:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
