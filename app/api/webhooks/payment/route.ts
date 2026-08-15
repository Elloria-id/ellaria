import { NextResponse } from 'next/server'
import { PaymentService } from '@/lib/payments/payment.service'
import { z } from 'zod'

// Schema per provider (sesuaikan dengan kebutuhan)
const webhookSchema = z.object({
  provider: z.enum(['midtrans', 'xendit', 'tripay', 'duitku']),
  signature: z.string(),
  body: z.any(),
})

export async function POST(req: Request) {
  try {
    const rawBody = await req.json()
    
    // Detect provider from request
    let provider = ''
    let signature = ''
    let body = rawBody

    // Midtrans
    if (rawBody.order_id && rawBody.transaction_status) {
      provider = 'midtrans'
      signature = req.headers.get('x-midtrans-signature') || ''
    }
    // Xendit
    else if (rawBody.id && rawBody.status) {
      provider = 'xendit'
      signature = req.headers.get('x-endit-signature') || ''
    }
    // Tripay
    else if (rawBody.reference && rawBody.status) {
      provider = 'tripay'
      signature = req.headers.get('x-tripay-signature') || ''
    }
    // Duitku
    else if (rawBody.merchantOrderId && rawBody.statusCode) {
      provider = 'duitku'
      signature = req.headers.get('x-duitku-signature') || ''
    }
    else {
      return NextResponse.json(
        { success: false, message: 'Unknown provider' },
        { status: 400 }
      )
    }

    // Process webhook
    const result = await PaymentService.processWebhook(provider, body, signature)

    return NextResponse.json({
      success: result.success,
      message: result.message,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    )
  }
}
