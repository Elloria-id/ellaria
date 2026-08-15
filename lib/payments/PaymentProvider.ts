export interface PaymentProvider {
  name: string
  createPayment(
    userId: string,
    packageId: string,
    amount: number,
    metadata?: any
  ): Promise<{
    paymentId: string
    paymentUrl?: string
    qrImage?: string
    instructions?: string
    expiresAt?: Date
  }>
  verifyPayment(paymentId: string): Promise<{
    status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED'
    metadata?: any
  }>
}
