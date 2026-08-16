import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { addCoins } from '@/lib/coins/wallet.service'
import { tripayProvider } from '@/lib/payments/Tripay'

export async function POST(req: Request) {
  try {
    const signature =
      req.headers.get('x-callback-signature') ||
      req.headers.get('x-signature') ||
      ''

    const payload = await req.json()

    if (
      !tripayProvider.validateCallback(
        payload,
        signature
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid signature',
        },
        { status: 403 }
      )
    }

    const merchantRef =
      payload?.merchant_ref

    const reference =
      payload?.reference

    const status =
      payload?.status

    if (!merchantRef || !reference) {
      return NextResponse.json(
        {
          success: false,
          message: 'Data callback tidak lengkap',
        },
        { status: 400 }
      )
    }

    const payments =
      await prisma.payment.findMany({
        where: {
          status: 'PENDING',
        },
        include: {
          package: true,
          user: true,
        },
      })

    const payment = payments.find((item) => {
      if (!item.adminNote) {
        return false
      }

      try {
        const metadata =
          JSON.parse(item.adminNote)

        return (
          metadata.merchantRef ===
          merchantRef
        )
      } catch {
        return false
      }
    })

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: 'Payment tidak ditemukan',
        },
        { status: 404 }
      )
    }

    if (status === 'PAID') {
      await prisma.$transaction(
        async (tx) => {
          const currentPayment =
            await tx.payment.findUnique({
              where: {
                id: payment.id,
              },
            })

          if (
            !currentPayment ||
            currentPayment.status !==
              'PENDING'
          ) {
            return
          }

          await tx.payment.update({
            where: {
              id: payment.id,
            },
            data: {
              status: 'PAID',
              reviewedAt: new Date(),
              adminNote: JSON.stringify({
                merchantRef,
                reference,
                status,
                provider: 'TRIPAY',
              }),
            },
          })
        }
      )

      await addCoins(
        payment.userId,
        payment.package.coins,
        'TOPUP',
        `Top up ${payment.package.coins} coin`,
        payment.id
      )
    } else if (
      status === 'EXPIRED' ||
      status === 'FAILED'
    ) {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status:
            status === 'EXPIRED'
              ? 'EXPIRED'
              : 'REJECTED',
          reviewedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Callback diterima',
    })
  } catch (error) {
    console.error(
      'Payment webhook error:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        message: 'Webhook error',
      },
      { status: 500 }
    )
  }
}
