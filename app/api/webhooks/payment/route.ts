import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { WalletService } from '@/lib/coins/wallet.service'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { paymentId, status, signature, provider } = body

    // Verify signature (untuk Tripay/Midtrans)
    if (provider === 'tripay') {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.TRIPAY_SECRET || '')
        .update(JSON.stringify(body))
        .digest('hex')

      if (signature !== expectedSignature) {
        return NextResponse.json(
          { success: false, message: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { package: true },
      })

      if (!payment || payment.status !== 'PENDING') {
        return null
      }

      if (status === 'PAID') {
        await tx.payment.update({
          where: { id: paymentId },
          data: { status: 'PAID' },
        })

        await WalletService.addCoinsInTransaction(
          tx,
          payment.userId,
          payment.package.coins,
          'TOPUP',
          payment.id,
          `Auto topup ${payment.package.name}`
        )

        await tx.notification.create({
          data: {
            userId: payment.userId,
            type: 'PAYMENT_APPROVED',
            title: 'Payment Otomatis Berhasil',
            message: `${payment.package.coins} koin telah ditambahkan ke akun Anda`,
          },
        })
      }

      return payment
    })

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Payment not found or already processed' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
