import type { PaymentProvider, CreatePaymentParams, PaymentResult } from './PaymentProvider'
import crypto from 'crypto'

export class MidtransProvider implements PaymentProvider {
  name = 'midtrans'

  private serverKey: string
  private clientKey: string
  private baseUrl: string

  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY || ''
    this.clientKey = process.env.MIDTRANS_CLIENT_KEY || ''
    this.baseUrl =
      process.env.NODE_ENV === 'production' ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com'
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const userId = params.userId ?? 'anonymous'
    const orderId = params.merchantRef || `ELLARIA-${Date.now()}-${userId.slice(0, 6)}`

    const payload = {
      payment_type: 'bank_transfer',
      transaction_details: {
        order_id: orderId,
        gross_amount: params.amount,
      },
      customer_details: {
        first_name: params.customerName || 'User',
        email: params.customerEmail || 'user@ellaria.com',
        phone: params.customerPhone || '',
      },
      item_details: [
        {
          id: params.packageId || params.merchantRef,
          price: params.amount,
          quantity: 1,
          name: params.itemName || params.metadata?.itemName || 'Ellaria Coin Package',
        },
      ],
    }

    const response = await fetch(`${this.baseUrl}/v2/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(this.serverKey + ':').toString('base64')}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Midtrans error: ${data.status_message || 'Unknown error'}`)
    }

    return {
      paymentId: orderId,
      providerReference: (data.transaction_id as string) || orderId,
      paymentUrl: (data.redirect_url as string) || (data.payment_url as string) || undefined,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metadata: data,
      success: true,
    }
  }

  async verifyPayment(providerReference: string) {
    const response = await fetch(`${this.baseUrl}/v2/${providerReference}/status`, {
      headers: {
        Authorization: `Basic ${Buffer.from(this.serverKey + ':').toString('base64')}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return { status: 'FAILED' }
    }

    const statusMap: Record<string, string> = {
      settlement: 'PAID',
      capture: 'PAID',
      pending: 'PENDING',
      deny: 'REJECTED',
      expire: 'EXPIRED',
      cancel: 'CANCELLED',
    }

    return {
      status: statusMap[data.transaction_status] || 'PENDING',
      metadata: data,
    }
  }

  verifyWebhookSignature(body: any, signature: string): boolean {
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${body.order_id}${body.status_code}${body.gross_amount}${this.serverKey}`)
      .digest('hex')

    return signature === expectedSignature
  }
}
