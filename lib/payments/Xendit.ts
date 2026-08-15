import { PaymentProvider } from './PaymentProvider'
import crypto from 'crypto'

export class XenditProvider implements PaymentProvider {
  name = 'xendit'

  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.XENDIT_API_KEY || ''
    this.baseUrl = 'https://api.xendit.co'
  }

  async createPayment(
    userId: string,
    packageId: string,
    amount: number,
    metadata?: any
  ) {
    const externalId = `ELLARIA-${Date.now()}-${userId.slice(0, 6)}`

    const payload = {
      external_id: externalId,
      amount: amount,
      payer_email: metadata?.email || 'user@ellaria.com',
      description: metadata?.description || 'Ellaria Coin Package',
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
    }
  }

  async verifyPayment(providerReference: string) {
    const response = await fetch(
      `${this.baseUrl}/v2/invoices/${providerReference}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
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
    }

    return {
      status: statusMap[data.status] || 'PENDING',
      metadata: data,
    }
  }

  verifyWebhookSignature(body: any, signature: string): boolean {
    // Xendit menggunakan x-endit-signature
    const expectedSignature = crypto
      .createHmac('sha256', this.apiKey)
      .update(JSON.stringify(body))
      .digest('hex')

    return signature === expectedSignature
  }
}
