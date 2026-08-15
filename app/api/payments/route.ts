import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'

const paymentSchema = z.object({
  packageId: z.string(),
  proofImage: z.string().optional(),
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

    const packageData = await prisma.coinPackage.findUnique({
      where: { id: validated.packageId },
    })

    if (!packageData) {
      return NextResponse.json(
        { success: false, message: 'Paket tidak ditemukan' },
        { status: 404 }
      )
    }

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        packageId: validated.packageId,
        amount: packageData.price,
        status: 'PENDING',
        proofImage: validated.proofImage,
      },
    })

    return NextResponse.json({
      success: true,
      data: payment,
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
