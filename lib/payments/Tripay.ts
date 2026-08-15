import { PaymentProvider } from './PaymentProvider'
import crypto from 'crypto'

export class TripayProvider implements PaymentProvider {
  name = 'tripay'

  private apiKey: string
  private merchantCode: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.TRIPAY_API_KEY || ''
    this.merchantCode = process.env.TRIPAY_MERCHANT_CODE || ''
    this.baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://tripay.co.id/api'
      : 'https://tripay.co.id/api-sandbox'
  }

  async createPayment(
    userId: string,
    packageId: string,
    amount: number,
    metadata?: any
  ) {
    const merchantRef = `ELLARIA-${Date.now()}-${userId.slice(0, 6)}`

    const payload = {
      method: 'QRIS',
      merchant_code: this.merchantCode,
      merchant_ref: merchantRef,
      amount: amount,
      customer_name: metadata?.username || 'User',
      customer_email: metadata?.email || 'user@ellaria.com',
      customer_phone: metadata?.phone || '',
      order_items: [
        {
          name: metadata?.description || 'Ellaria Coin Package',
          price: amount,
          quantity: 1,
        },
      ],
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payment`,
      signature: this.generateSignature(merchantRef, amount),
    }

    const response = await fetch(`${this.baseUrl}/transaction/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Tripay error: ${data.message || 'Unknown error'}`)
    }

    return {
      paymentId: merchantRef,
      providerReference: data.data.reference,
      paymentUrl: data.data.checkout_url,
      qrImage: data.data.qr_string,
      expiresAt: new Date(data.data.expired_time * 1000),
    }
  }

  async verifyPayment(providerReference: string) {
    const response = await fetch(
      `${this.baseUrl}/transaction/detail?reference=${providerReference}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return { status: 'FAILED' }
    }

    const statusMap: Record<string, any> = {
      'PAID': 'PAID',
      'SETTLED': 'PAID',
      'PENDING': 'PENDING',
      'EXPIRED': 'EXPIRED',
      'FAILED': 'FAILED',
    }

    return {
      status: statusMap[data.data.status] || 'PENDING',
      metadata: data.data,
    }
  }

  verifyWebhookSignature(body: any, signature: string): boolean {
    // Tripay menggunakan signature dengan API key
    const expectedSignature = crypto
      .createHmac('sha256', this.apiKey)
      .update(JSON.stringify(body))
      .digest('hex')

    return signature === expectedSignature
  }

  private generateSignature(merchantRef: string, amount: number): string {
    const hash = crypto
      .createHmac('sha256', this.apiKey)
      .update(`${this.merchantCode}${merchantRef}${amount}`)
      .digest('hex')
    return hash
  }
}
