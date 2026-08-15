import { PaymentProvider } from './PaymentProvider'
import crypto from 'crypto'

export class MidtransProvider implements PaymentProvider {
  name = 'midtrans'

  private serverKey: string
  private clientKey: string
  private baseUrl: string

  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY || ''
    this.clientKey = process.env.MIDTRANS_CLIENT_KEY || ''
    this.baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.midtrans.com'
      : 'https://api.sandbox.midtrans.com'
  }

  async createPayment(
    userId: string,
    packageId: string,
    amount: number,
    metadata?: any
  ) {
    const orderId = `ELLARIA-${Date.now()}-${userId.slice(0, 6)}`

    const payload = {
      payment_type: 'bank_transfer',
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: metadata?.username || 'User',
        email: metadata?.email || 'user@ellaria.com',
        phone: metadata?.phone || '',
      },
      item_details: [
        {
          id: packageId,
          price: amount,
          quantity: 1,
          name: metadata?.description || 'Ellaria Coin Package',
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
      providerReference: data.transaction_id || orderId,
      paymentUrl: data.redirect_url || data.payment_url,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }
  }

  async verifyPayment(providerReference: string) {
    const response = await fetch(
      `${this.baseUrl}/v2/${providerReference}/status`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(this.serverKey + ':').toString('base64')}`,
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return { status: 'FAILED' }
    }

    const statusMap: Record<string, any> = {
      'settlement': 'PAID',
      'capture': 'PAID',
      'pending': 'PENDING',
      'deny': 'FAILED',
      'expire': 'EXPIRED',
      'cancel': 'FAILED',
    }

    return {
      status: statusMap[data.transaction_status] || 'PENDING',
      metadata: data,
    }
  }

  verifyWebhookSignature(body: any, signature: string): boolean {
    // Midtrans menggunakan signature dengan server key
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${body.order_id}${body.status_code}${body.gross_amount}${this.serverKey}`)
      .digest('hex')

    return signature === expectedSignature
  }
}
