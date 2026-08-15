import { PaymentProvider } from './PaymentProvider'

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
    // Implementasi Tripay API
    // Untuk V3 lengkap
    const paymentId = `TRIPAY-${Date.now()}`
    return {
      paymentId,
      paymentUrl: `https://tripay.co.id/checkout/${paymentId}`,
      instructions: 'Pembayaran akan diproses melalui Tripay',
    }
  }

  async verifyPayment(paymentId: string) {
    // Implementasi verifikasi webhook
    return {
      status: 'PENDING',
    }
  }
}
