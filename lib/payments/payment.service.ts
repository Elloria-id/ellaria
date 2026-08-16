import { prisma } from '@/lib/db/prisma'
import { WalletService } from '@/lib/coins/wallet.service'
import type { PaymentProvider, CreatePaymentParams, PaymentResult } from './PaymentProvider'
import { ManualQRISProvider } from './ManualQRIS'
import { MidtransProvider } from './Midtrans'
import { XenditProvider } from './Xendit'
import { TripayProvider } from './Tripay'
import { DuitkuProvider } from './Duitku'
import type { Prisma, PaymentStatus as PrismaPaymentStatus } from '@prisma/client'

export class PaymentService {
  private static provider: PaymentProvider | null = null

  static getProvider(): PaymentProvider {
    if (this.provider) return this.provider

    const providerName = process.env.PAYMENT_PROVIDER || 'manual'

    switch (providerName) {
      case 'midtrans':
        this.provider = new MidtransProvider()
        break
      case 'xendit':
        this.provider = new XenditProvider()
        break
      case 'tripay':
        this.provider = new TripayProvider()
        break
      case 'duitku':
        this.provider = new DuitkuProvider()
        break
      case 'manual':
      default:
        this.provider = new ManualQRISProvider()
        break
    }

    return this.provider
  }

  // Create payment - adapt to provider contract
  static async createPayment(
    userId: string,
    packageId: string,
    metadata?: Record<string, unknown>
  ) {
    const provider = this.getProvider()
    const packageData = await prisma.coinPackage.findUnique({
      where: { id: packageId },
    })

    if (!packageData) {
      throw new Error('Paket tidak ditemukan')
    }

    // create local payment record first
    const payment = await prisma.payment.create({
      data: {
        userId,
        packageId,
        amount: packageData.price,
        status: 'PENDING',
        provider: provider.name,
      },
    })

    // prepare canonical params for provider
    const merchantRef = `ELLARIA-${Date.now()}-${userId.slice(0, 6)}`
    const params: CreatePaymentParams = {
      merchantRef,
      amount: packageData.price,
      method: (metadata?.method as string) || undefined,
      customerName: (metadata?.username as string) || undefined,
      customerEmail: (metadata?.email as string) || undefined,
      customerPhone: (metadata?.phone as string) || undefined,
      itemName: packageData.name,
      callbackUrl: (metadata?.callbackUrl as string) || process.env.PAYMENT_CALLBACK_URL || undefined,
      returnUrl: (metadata?.returnUrl as string) || process.env.NEXT_PUBLIC_APP_URL || undefined,
      metadata,
      userId,
      packageId,
    }

    const providerResult = await provider.createPayment(params)

    // map provider result to DB fields (use providerRef per Prisma schema)
    const providerRef =
      (providerResult.providerReference as string | undefined) ||
      (providerResult.reference as string | undefined) ||
      (providerResult.merchantRef as string | undefined) ||
      merchantRef

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerRef,
        paymentUrl: (providerResult.paymentUrl as string | undefined) || null,
        qrImage: (providerResult.qrImage as string | undefined) || null,
        expiresAt:
          providerResult.expiresAt
            ? typeof providerResult.expiresAt === 'string'
              ? new Date(providerResult.expiresAt)
              : (providerResult.expiresAt as Date)
            : undefined,
      },
    })

    return {
      ...payment,
      ...providerResult,
      providerRef,
    }
  }

  // Process incoming webhook payload; provider is string name to route logic for provider-specific fields
  static async processWebhook(
    provider: string,
    body: unknown,
    signature?: string
  ): Promise<{ success: boolean; message: string }> {
    const providerInstance = this.getProvider()

    // Verify signature using available helper
    const isValidWebhook =
      (typeof providerInstance.validateCallback === 'function' && providerInstance.validateCallback(body, signature)) ||
      (typeof providerInstance.verifyWebhookSignature === 'function' && providerInstance.verifyWebhookSignature(body, signature))

    if (!isValidWebhook) {
      throw new Error('Invalid webhook signature')
    }

    // Extract providerReference and normalize status according to provider-specific payload
    let providerReference = ''
    let status: PrismaPaymentStatus | 'PENDING' = 'PENDING'

    // provider-specific extraction
    const payloadAny = body as any
    switch (provider) {
      case 'midtrans':
        providerReference = payloadAny.order_id || payloadAny.transaction_id || ''
        status =
          payloadAny.transaction_status === 'settlement' || payloadAny.transaction_status === 'capture'
            ? 'PAID'
            : payloadAny.transaction_status === 'expire'
            ? 'EXPIRED'
            : 'PENDING'
        break
      case 'xendit':
        providerReference = payloadAny.id || ''
        status =
          payloadAny.status === 'PAID' || payloadAny.status === 'SETTLED'
            ? 'PAID'
            : payloadAny.status === 'EXPIRED'
            ? 'EXPIRED'
            : 'PENDING'
        break
      case 'tripay':
        providerReference = payloadAny.reference || ''
        status =
          payloadAny.status === 'PAID' || payloadAny.status === 'SETTLED'
            ? 'PAID'
            : payloadAny.status === 'EXPIRED'
            ? 'EXPIRED'
            : 'PENDING'
        break
      case 'duitku':
        providerReference = payloadAny.merchantOrderId || payloadAny.Reference || ''
        status =
          payloadAny.statusCode === '00'
            ? 'PAID'
            : payloadAny.statusCode === '02'
            ? 'EXPIRED'
            : 'PENDING'
        break
      default:
        // fallback: try to read common fields
        providerReference = (payloadAny.providerReference as string) || (payloadAny.reference as string) || ''
        status = (payloadAny.status as PrismaPaymentStatus) || 'PENDING'
    }

    // Process payment if PAID, idempotent
    if (status === 'PAID') {
      const result = await this.processPaymentInternal(providerReference, provider)
      return {
        success: true,
        message: `Payment processed: ${result.message}`,
      }
    }

    return {
      success: true,
      message: `Payment status: ${status}`,
    }
  }

  private static async processPaymentInternal(
    providerReference: string,
    provider: string
  ): Promise<{ success: boolean; message: string }> {
    return await prisma.$transaction(async (tx) => {
      // Find payment by providerRef (Prisma schema uses providerRef)
      const payment = await tx.payment.findFirst({
        where: {
          providerRef: providerReference,
          provider,
        },
        include: {
          package: true,
          user: true,
        },
      })

      if (!payment) {
        throw new Error('Payment tidak ditemukan')
      }

      // Prevent double approval
      if (payment.status === 'PAID') {
        return {
          success: true,
          message: 'Payment already processed',
        }
      }

      if (payment.status !== 'PENDING') {
        return {
          success: false,
          message: `Payment status is ${payment.status}`,
        }
      }

      // Update payment status
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          reviewedAt: new Date(),
        },
      })

      // Add coins to wallet using WalletService helper that runs within transaction
      // The WalletService.addCoinsInTransaction must accept Prisma.TransactionClient as first param
      await WalletService.addCoinsInTransaction(
        tx as Prisma.TransactionClient,
        payment.userId,
        payment.package.coins,
        'TOPUP',
        payment.id,
        `Auto topup ${payment.package.name} via ${provider}`
      )

      // Create notification
      await tx.notification.create({
        data: {
          userId: payment.userId,
          type: 'PAYMENT_APPROVED',
          title: 'Payment Berhasil',
          message: `${payment.package.coins} koin telah ditambahkan ke akun Anda melalui ${provider}`,
        },
      })

      return {
        success: true,
        message: `Payment ${payment.id} processed`,
      }
    })
  }

  static async getPaymentStatus(paymentId: string): Promise<any> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        package: true,
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    })

    if (!payment) {
      throw new Error('Payment tidak ditemukan')
    }

    // If not manual and still PENDING, verify with provider
    if (payment.provider !== 'manual' && payment.status === 'PENDING' && payment.providerRef) {
      const provider = this.getProvider()
      try {
        let result:
          | { status: string; metadata?: unknown }
          | undefined = undefined

        if (typeof provider.verifyPayment === 'function') {
          result = await provider.verifyPayment(payment.providerRef)
        } else if (typeof provider.getPaymentStatus === 'function') {
          result = await provider.getPaymentStatus(payment.providerRef)
        }

        if (result?.status === 'PAID') {
          await this.processPaymentInternal(payment.providerRef, payment.provider)
          // Re-fetch payment
          const updated = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
              package: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          })
          return updated
        }
      } catch {
        // Silently fail, keep current status
      }
    }

    return payment
  }

  static async manualApprove(
    paymentId: string,
    adminUserId: string,
    note?: string
  ): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { package: true },
      })

      if (!payment) {
        throw new Error('Payment tidak ditemukan')
      }

      if (payment.status === 'PAID') {
        throw new Error('Payment sudah diproses')
      }

      if (payment.status !== 'PENDING') {
        throw new Error(`Payment status adalah ${payment.status}`)
      }

      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          reviewedAt: new Date(),
          adminNote: note,
        },
      })

      await WalletService.addCoinsInTransaction(
        tx as Prisma.TransactionClient,
        payment.userId,
        payment.package.coins,
        'TOPUP',
        payment.id,
        `Manual approval ${payment.package.name}`
      )

      await tx.notification.create({
        data: {
          userId: payment.userId,
          type: 'PAYMENT_APPROVED',
          title: 'Payment Disetujui (Manual)',
          message: `${payment.package.coins} koin telah ditambahkan ke akun Anda`,
        },
      })

      return payment
    })
  }

  static async manualReject(
    paymentId: string,
    adminUserId: string,
    note?: string
  ): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
      })

      if (!payment) {
        throw new Error('Payment tidak ditemukan')
      }

      if (payment.status === 'PAID') {
        throw new Error('Payment sudah diproses')
      }

      if (payment.status !== 'PENDING') {
        throw new Error(`Payment status adalah ${payment.status}`)
      }

      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          adminNote: note,
        },
      })

      await tx.notification.create({
        data: {
          userId: payment.userId,
          type: 'PAYMENT_REJECTED',
          title: 'Payment Ditolak',
          message: note || 'Payment Anda ditolak. Silakan hubungi admin.',
        },
      })

      return payment
    })
  }
}
