import { PaymentProvider } from './PaymentProvider'
import crypto from 'crypto'

export class ManualQRISProvider implements PaymentProvider {
  name = 'manual'

  async createPayment(
    userId: string,
    packageId: string,
    amount: number,
    metadata?: any
  ) {
    const paymentId = `MANUAL-${Date.now()}-${userId.slice(0, 8)}`

    return {
      paymentId,
      providerReference: paymentId,
      qrImage: process.env.QRIS_IMAGE_URL || '/images/qris-placeholder.png',
      instructions: 'Scan QRIS di atas untuk melakukan pembayaran. Upload bukti pembayaran setelah transfer.',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }
  }

  async verifyPayment(providerReference: string) {
    // Manual tidak bisa verifikasi otomatis
    return { status: 'PENDING' }
  }

  verifyWebhookSignature(body: any, signature: string): boolean {
    // Manual tidak menggunakan webhook
    return false
  }
}
