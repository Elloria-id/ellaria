import type {
  PaymentProvider,
  CreatePaymentParams,
  PaymentResult,
} from './PaymentProvider'

export class ManualQRISProvider implements PaymentProvider {
  name = 'manual'

  async createPayment(
    params: CreatePaymentParams
  ): Promise<PaymentResult> {
    const userId = params.userId ?? 'anonymous'

    const paymentId =
      params.merchantRef ??
      `MANUAL-${Date.now()}-${userId.slice(0, 8)}`

    return {
      paymentId,
      providerReference: paymentId,
      qrImage:
        process.env.QRIS_IMAGE_URL ??
        '/images/qris-placeholder.png',
      metadata: {
        instructions:
          'Scan QRIS di atas untuk melakukan pembayaran. Upload bukti pembayaran setelah transfer.',
      },
      expiresAt: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ),
      success: true,
    }
  }

  async verifyPayment(_providerReference: string) {
    return {
      status: 'PENDING' as const,
    }
  }

  verifyWebhookSignature(
    _body: unknown,
    _signature?: string
  ): boolean {
    return false
  }

  validateCallback(
    _payload: unknown,
    _signature?: string
  ): boolean {
    return false
  }
}
