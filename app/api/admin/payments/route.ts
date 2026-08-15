import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { WalletService } from '@/lib/coins/wallet.service'
import { z } from 'zod'

const reviewSchema = z.object({
  paymentId: z.string(),
  status: z.enum(['APPROVED', 'REJECTED']),
  note: z.string().optional(),
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

    const url = new URL(req.url)
    const status = url.searchParams.get('status') || 'PENDING'
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Number(url.searchParams.get('limit')) || 20

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { status: status as any },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          package: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where: { status: status as any } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = reviewSchema.parse(body)

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: validated.paymentId },
        include: { package: true, user: true },
      })

      if (!payment) {
        throw new Error('Payment tidak ditemukan')
      }

      if (payment.status !== 'PENDING') {
        throw new Error(`Payment sudah ${payment.status.toLowerCase()}`)
      }

      const updatedPayment = await tx.payment.update({
        where: { id: validated.paymentId },
        data: {
          status: validated.status,
          adminNote: validated.note,
          reviewedAt: new Date(),
        },
      })

      if (validated.status === 'APPROVED') {
        await WalletService.addCoinsInTransaction(
          tx,
          payment.userId,
          payment.package.coins,
          'TOPUP',
          payment.id,
          `Topup ${payment.package.name}`
        )

        await tx.notification.create({
          data: {
            userId: payment.userId,
            type: 'PAYMENT_APPROVED',
            title: 'Payment Disetujui',
            message: `${payment.package.coins} koin telah ditambahkan ke akun Anda`,
          },
        })
      } else {
        await tx.notification.create({
          data: {
            userId: payment.userId,
            type: 'PAYMENT_REJECTED',
            title: 'Payment Ditolak',
            message: validated.note || 'Payment Anda ditolak. Silakan hubungi admin.',
          },
        })
      }

      return updatedPayment
    })

    return NextResponse.json({
      success: true,
      message: `Payment ${validated.status.toLowerCase()}`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Input tidak valid' },
        { status: 400 }
      )
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
