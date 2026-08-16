import type { PaymentProvider, CreatePaymentParams, PaymentResult } from './PaymentProvider'
import crypto from 'crypto'

export class XenditProvider implements PaymentProvider {
  name = 'xendit'

  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.XENDIT_API_KEY || ''
    this.baseUrl = 'https://api.xendit.co'
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const userId = params.userId ?? 'anonymous'
    const externalId = params.merchantRef || `ELLARIA-${Date.now()}-${userId.slice(0, 6)}`

    const payload = {
      external_id: externalId,
      amount: params.amount,
      payer_email: params.customerEmail || 'user@ellaria.com',
      description: params.itemName || 'Ellaria Coin Package',
      invoice_duration: 86400, // 24 jam
    }

    const response = await fetch(`${this.baseUrl}/v2/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Xendit error: ${data.message || 'Unknown error'}`)
    }

    return {
      paymentId: externalId,
      providerReference: data.id,
      paymentUrl: data.invoice_url,
      expiresAt: new Date(data.expiry_date),
      metadata: data,
      success: true,
    }
  }

  async verifyPayment(providerReference: string) {
    const response = await fetch(`${this.baseUrl}/v2/invoices/${providerReference}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return { status: 'FAILED' }
    }

    const statusMap: Record<string, string> = {
      PAID: 'PAID',
      SETTLED: 'PAID',
      PENDING: 'PENDING',
      EXPIRED: 'EXPIRED',
    }

    return {
      status: statusMap[data.status] || 'PENDING',
      metadata: data,
    }
  }

  verifyWebhookSignature(body: any, signature: string): boolean {
    const expectedSignature = crypto.createHmac('sha256', this.apiKey).update(JSON.stringify(body)).digest('hex')
    return signature === expectedSignature
  }
}
