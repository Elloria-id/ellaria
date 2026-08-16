import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { PaymentService } from '@/lib/payments/payment.service'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payment = await PaymentService.getPaymentStatus(params.id)

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment tidak ditemukan' },
        { status: 404 }
      )
    }

    // Verifikasi ownership
    if (
      payment.userId !== session.user.id &&
      !['ADMIN', 'FOUNDER'].includes(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: payment,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error
          ? error.message
          : 'Terjadi kesalahan',
      },
      { status: 500 }
    )
  }
}
