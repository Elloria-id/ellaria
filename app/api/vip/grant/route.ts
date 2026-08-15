import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { VIPService } from '@/lib/vip/vip.service'
import { z } from 'zod'

const grantSchema = z.object({
  userId: z.string(),
  planId: z.string(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Hanya ADMIN dan FOUNDER yang bisa grant VIP
    if (!['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validated = grantSchema.parse(body)

    const vip = await VIPService.grantVIP(
      validated.userId,
      validated.planId,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: vip,
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
