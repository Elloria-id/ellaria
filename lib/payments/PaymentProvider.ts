export interface PaymentProvider {
  // Identitas provider
  name: string

  // Membuat transaksi pembayaran
  createPayment(
    userId: string,
    packageId: string,
    amount: number,
    metadata?: {
      username?: string
      email?: string
      phone?: string
      description?: string
    }
  ): Promise<{
    paymentId: string          // ID internal
    providerReference: string  // ID dari gateway
    paymentUrl?: string        // URL redirect (Midtrans/Xendit/Tripay)
    qrImage?: string           // QRIS untuk manual
    instructions?: string
    expiresAt?: Date
  }>

  // Verifikasi status pembayaran (untuk polling manual)
  verifyPayment(providerReference: string): Promise<{
    status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED'
    metadata?: any
  }>

  // Verifikasi webhook signature (untuk keamanan)
  verifyWebhookSignature(body: any, signature: string): boolean
}
