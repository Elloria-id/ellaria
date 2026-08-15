import { PaymentProvider } from './PaymentProvider'

export class ManualQRISProvider implements PaymentProvider {
  name = 'manual_qris'

  async createPayment(
    userId: string,
    packageId: string,
    amount: number,
    metadata?: any
  ) {
    // Generate unique payment reference
    const paymentId = `QRIS-${Date.now()}-${userId.slice(0, 8)}`

    return {
      paymentId,
      qrImage: process.env.QRIS_IMAGE_URL || '/images/qris-placeholder.png',
      instructions: 'Scan QRIS di atas untuk melakukan pembayaran. Upload bukti pembayaran setelah transfer.',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 jam
    }
  }

  async verifyPayment(paymentId: string) {
    // Manual QRIS tidak bisa verifikasi otomatis
    // Diverifikasi oleh admin
    return {
      status: 'PENDING',
    }
  }
}
