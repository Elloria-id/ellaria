export interface CreatePaymentParams {
  // Unique merchant reference for this payment (should be saved to DB as providerRef)
  merchantRef: string
  // amount in provider's expected currency unit (match your prisma payment.amount)
  amount: number
  // optional payment method identifier (e.g., 'QRIS', 'BANK_TRANSFER', etc.)
  method?: string
  // optional metadata about customer/item
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  itemName?: string
  returnUrl?: string
  callbackUrl?: string
  // provider-agnostic metadata bag
  metadata?: Record<string, unknown>
  // optional context that some providers may use
  userId?: string
  packageId?: string
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | string

export interface PaymentResult {
  // canonical provider reference string (mapped to Prisma.payment.providerRef)
  providerReference?: string
  // direct provider checkout/payment url (if any)
  paymentUrl?: string
  // provider QR image / data
  qrImage?: string
  // local generated payment id (merchantRef/orderId)
  paymentId?: string
  // provider status (optional)
  status?: PaymentStatus
  // expiry as Date or ISO string
  expiresAt?: string | Date
  // provider raw metadata
  metadata?: unknown
  // success flag and message
  success?: boolean
  message?: string
  // allow extra provider-specific fields
  [key: string]: unknown
}

export interface PaymentProvider {
  name: string

  // Create payment given canonical params
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>

  // Optional: provider may expose verification by providerReference
  verifyPayment?(providerReference: string): Promise<{ status: PaymentStatus; metadata?: unknown }>

  // Optional alternative name used by some providers
  getPaymentStatus?(reference: string): Promise<{ status: PaymentStatus; metadata?: unknown }>

  // Webhook verification helpers (some providers implement one or the other)
  validateCallback?(payload: unknown, signature?: string): boolean
  verifyWebhookSignature?(body: unknown, signature?: string): boolean
}
