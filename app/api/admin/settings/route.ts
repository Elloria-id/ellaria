import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'

const settingsSchema = z.object({
  siteName: z.string().optional(),
  announcement: z.string().optional(),
  defaultCoinPrice: z.number().min(0).optional(),
  defaultWaitSeconds: z.number().min(0).optional(),
  maintenanceMode: z.boolean().optional(),
  leaderboardReset: z.string().optional(),
  vipPricing: z.record(z.number()).optional(),
})

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const settings = await prisma.siteSetting.findUnique({
      where: { key: 'site_config' },
    })

    return NextResponse.json({
      success: true,
      data: settings?.value || {},
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = settingsSchema.parse(body)

    const currentSettings = await prisma.siteSetting.findUnique({
      where: { key: 'site_config' },
    })

    const newSettings = {
      ...(currentSettings?.value as object || {}),
      ...validated,
    }

    const settings = await prisma.siteSetting.upsert({
      where: { key: 'site_config' },
      update: { value: newSettings },
      create: {
        key: 'site_config',
        value: newSettings,
      },
    })

    return NextResponse.json({
      success: true,
      data: settings.value,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Input tidak valid' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
