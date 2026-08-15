import { PaymentProvider } from './PaymentProvider'
import crypto from 'crypto'

export class DuitkuProvider implements PaymentProvider {
  name = 'duitku'

  private apiKey: string
  private merchantCode: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.DUITKU_API_KEY || ''
    this.merchantCode = process.env.DUITKU_MERCHANT_CODE || ''
    this.baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.duitku.com'
      : 'https://sandbox.duitku.com'
  }

  async createPayment(
    userId: string,
    packageId: string,
    amount: number,
    metadata?: any
  ) {
    const merchantOrderId = `ELLARIA-${Date.now()}-${userId.slice(0, 6)}`
    const datetime = new Date().toISOString().slice(0, 19).replace(/[^0-9]/g, '')

    const signature = crypto
      .createHash('md5')
      .update(`${this.merchantCode}${merchantOrderId}${amount}${datetime}${this.apiKey}`)
      .digest('hex')

    const payload = {
      merchantCode: this.merchantCode,
      merchantOrderId: merchantOrderId,
      paymentAmount: amount,
      paymentMethod: 'QRIS',
      customerName: metadata?.username || 'User',
      customerEmail: metadata?.email || 'user@ellaria.com',
      customerPhone: metadata?.phone || '',
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      signature: signature,
      expiryPeriod: 60, // menit
    }

    const response = await fetch(`${this.baseUrl}/api/v2/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Duitku error: ${data.Message || 'Unknown error'}`)
    }

    return {
      paymentId: merchantOrderId,
      providerReference: data.Reference || merchantOrderId,
      paymentUrl: data.PaymentUrl,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    }
  }

  async verifyPayment(providerReference: string) {
    const response = await fetch(
      `${this.baseUrl}/api/merchant/transactionStatus?merchantCode=${this.merchantCode}&reference=${providerReference}`,
      {
        headers: {
          'apikey': this.apiKey,
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return { status: 'FAILED' }
    }

    const statusMap: Record<string, any> = {
      '00': 'PAID',
      '01': 'PENDING',
      '02': 'EXPIRED',
      '03': 'FAILED',
    }

    return {
      status: statusMap[data.StatusCode] || 'PENDING',
      metadata: data,
    }
  }

  verifyWebhookSignature(body: any, signature: string): boolean {
    // Duitku menggunakan callback signature
    // body biasanya berisi merchantOrderId, paymentAmount, status
    const expectedSignature = crypto
      .createHash('md5')
      .update(`${this.merchantCode}${body.merchantOrderId}${body.paymentAmount}${this.apiKey}`)
      .digest('hex')

    return signature === expectedSignature
  }
}
