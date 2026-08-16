export interface CreatePaymentParams {
  merchantRef: string
  amount: number
  method: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  itemName: string
  returnUrl?: string
  callbackUrl?: string
}

export interface PaymentResult {
  success: boolean
  reference?: string
  merchantRef?: string
  amount?: number
  status?: string
  checkoutUrl?: string
  qrUrl?: string
  qrString?: string
  expiredAt?: string
  message?: string
}

export interface PaymentProvider {
  createPayment(
    params: CreatePaymentParams
  ): Promise<PaymentResult>

  getPaymentStatus(
    reference: string
  ): Promise<PaymentResult>

  validateCallback(
    payload: unknown,
    signature: string
  ): boolean
}
