import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { tripayProvider } from '@/lib/payments/Tripay'

export async function POST(req: Request) {
  try {
    const session =
      await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    const body = await req.json()

    const packageId = body?.packageId
    const method =
      body?.method || 'QRIS2'

    if (!packageId) {
      return NextResponse.json(
        {
          success: false,
          message: 'packageId wajib diisi',
        },
        { status: 400 }
      )
    }

    const coinPackage =
      await prisma.coinPackage.findUnique({
        where: {
          id: packageId,
        },
      })

    if (!coinPackage || !coinPackage.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'Paket coin tidak ditemukan',
        },
        { status: 404 }
      )
    }

    const merchantRef =
      `ELLARIA-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`

    const payment =
      await prisma.payment.create({
        data: {
          userId: session.user.id,
          packageId: coinPackage.id,
          amount: coinPackage.price,
          status: 'PENDING',
        },
      })

    try {
      const result =
        await tripayProvider.createPayment({
          merchantRef,
          amount: Math.round(
            coinPackage.price
          ),
          method,
          customerName:
            session.user.username ||
            'Ellaria User',
          customerEmail:
            session.user.email ||
            '',
          itemName: coinPackage.name,
          callbackUrl:
            process.env.TRIPAY_CALLBACK_URL,
          returnUrl:
            process.env.TRIPAY_RETURN_URL,
        })

      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          adminNote: JSON.stringify({
            merchantRef,
            reference:
              result.reference,
            provider: 'TRIPAY',
            method,
            qrUrl: result.qrUrl,
            qrString: result.qrString,
            checkoutUrl:
              result.checkoutUrl,
            expiredAt:
              result.expiredAt,
          }),
        },
      })

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        merchantRef,
        reference: result.reference,
        amount: result.amount,
        status: result.status,
        checkoutUrl:
          result.checkoutUrl,
        qrUrl: result.qrUrl,
        qrString: result.qrString,
        expiredAt:
          result.expiredAt,
      })
    } catch (providerError) {
      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: 'REJECTED',
          adminNote:
            providerError instanceof Error
              ? providerError.message
              : 'Provider payment error',
        },
      })

      throw providerError
    }
  } catch (error) {
    console.error(
      'POST /api/payments error:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Gagal membuat pembayaran',
      },
      { status: 500 }
    )
  }
}
