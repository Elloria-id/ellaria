import crypto from 'crypto'
import {
  CreatePaymentParams,
  PaymentProvider,
  PaymentResult,
} from './PaymentProvider'

const TRIPAY_BASE_URL =
  process.env.TRIPAY_BASE_URL ||
  'https://tripay.co.id/api-sandbox'

export class TripayProvider implements PaymentProvider {
  private apiKey: string
  private privateKey: string
  private merchantCode: string

  constructor() {
    this.apiKey = process.env.TRIPAY_API_KEY || ''
    this.privateKey = process.env.TRIPAY_PRIVATE_KEY || ''
    this.merchantCode = process.env.TRIPAY_MERCHANT_CODE || ''

    if (
      !this.apiKey ||
      !this.privateKey ||
      !this.merchantCode
    ) {
      throw new Error(
        'Konfigurasi TriPay belum lengkap'
      )
    }
  }

  async createPayment(
    params: CreatePaymentParams
  ): Promise<PaymentResult> {
    const signature = crypto
      .createHmac('sha256', this.privateKey)
      .update(
        this.merchantCode +
          params.merchantRef +
          params.amount
      )
      .digest('hex')

    const payload = {
      method: params.method,
      merchant_ref: params.merchantRef,
      amount: params.amount,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone || '',
      order_items: [
        {
          sku: params.merchantRef,
          name: params.itemName,
          price: params.amount,
          quantity: 1,
        },
      ],
      callback_url:
        params.callbackUrl ||
        process.env.TRIPAY_CALLBACK_URL,
      return_url:
        params.returnUrl ||
        process.env.TRIPAY_RETURN_URL,
      expired_time:
        Math.floor(Date.now() / 1000) +
        60 * 60,
      signature,
    }

    const response = await fetch(
      `${TRIPAY_BASE_URL}/transaction/create`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(
        data?.message ||
          'Gagal membuat transaksi TriPay'
      )
    }

    const result = data.data

    return {
      success: true,
      reference: result.reference,
      merchantRef: result.merchant_ref,
      amount: result.amount,
      status: result.status,
      checkoutUrl: result.checkout_url,
      qrUrl:
        result.qr_url ||
        result.qr_url_image,
      qrString:
        result.qr_string ||
        result.qrString,
      expiredAt:
        result.expired_time
          ? new Date(
              result.expired_time * 1000
            ).toISOString()
          : undefined,
    }
  }

  async getPaymentStatus(
    reference: string
  ): Promise<PaymentResult> {
    const response = await fetch(
      `${TRIPAY_BASE_URL}/transaction/detail?reference=${encodeURIComponent(
        reference
      )}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        cache: 'no-store',
      }
    )

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(
        data?.message ||
          'Gagal mengambil status pembayaran'
      )
    }

    const result = data.data

    return {
      success: true,
      reference: result.reference,
      merchantRef: result.merchant_ref,
      amount: result.amount,
      status: result.status,
      checkoutUrl: result.checkout_url,
      qrUrl:
        result.qr_url ||
        result.qr_url_image,
      qrString:
        result.qr_string ||
        result.qrString,
      expiredAt:
        result.expired_time
          ? new Date(
              result.expired_time * 1000
            ).toISOString()
          : undefined,
    }
  }

  validateCallback(
    payload: unknown,
    signature: string
  ): boolean {
    if (!signature || !this.privateKey) {
      return false
    }

    const rawPayload = JSON.stringify(payload)

    const expectedSignature = crypto
      .createHmac('sha256', this.privateKey)
      .update(rawPayload)
      .digest('hex')

    if (
      expectedSignature.length !==
      signature.length
    ) {
      return false
    }

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    )
  }
}

export const tripayProvider =
  new TripayProvider()
