import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { PaymentService } from '@/lib/payments/payment.service'
import { z } from 'zod'

const paymentSchema = z.object({
  packageId: z.string(),
  metadata: z.object({
    username: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).optional(),
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

    const body = await req.json()
    const validated = paymentSchema.parse(body)

    const result = await PaymentService.createPayment(
      session.user.id,
      validated.packageId,
      {
        username: session.user.username,
        email: session.user.email,
        ...validated.metadata,
      }
    )

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Input tidak valid' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payments = await prisma.payment.findMany({
      where: { userId: session.user.id },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: payments,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
