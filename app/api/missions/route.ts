import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { MissionService } from '@/lib/missions/mission.service'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const type = url.searchParams.get('type') || 'DAILY'

    const missions = await prisma.mission.findMany({
      where: {
        type,
        isActive: true,
      },
      include: {
        userMissions: {
          where: { userId: session.user.id },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Check and complete missions
    await MissionService.checkAndCompleteMissions(session.user.id)

    return NextResponse.json({
      success: true,
      data: missions,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
