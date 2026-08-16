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
  private static provider?: PaymentProvider

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

    const payment = await prisma.payment.create({
      data: {
        userId,
        packageId,
        amount: packageData.price,
        status: 'PENDING',
        provider: provider.name,
      },
    })

    const merchantRef = `ELLARIA-${Date.now()}-${userId.slice(0, 6)}`

    const params: CreatePaymentParams = {
      merchantRef,
      amount: packageData.price,
      method: typeof metadata?.method === 'string' ? metadata.method : undefined,
      customerName:
        typeof metadata?.username === 'string' ? metadata.username : undefined,
      customerEmail:
        typeof metadata?.email === 'string' ? metadata.email : undefined,
      customerPhone:
        typeof metadata?.phone === 'string' ? metadata.phone : undefined,
      itemName: packageData.name,
      callbackUrl:
        typeof metadata?.callbackUrl === 'string'
          ? metadata.callbackUrl
          : process.env.PAYMENT_CALLBACK_URL || undefined,
      returnUrl:
        typeof metadata?.returnUrl === 'string'
          ? metadata.returnUrl
          : process.env.NEXT_PUBLIC_APP_URL || undefined,
      metadata,
      userId,
      packageId,
    }

    const providerResult: PaymentResult =
      await provider.createPayment(params)

    const providerRef =
      providerResult.providerReference ||
      providerResult.reference ||
      providerResult.merchantRef ||
      merchantRef

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerRef,
        expiresAt: providerResult.expiresAt
          ? typeof providerResult.expiresAt === 'string'
            ? new Date(providerResult.expiresAt)
            : providerResult.expiresAt
          : undefined,
      },
    })

    return {
      ...payment,
      ...providerResult,
      providerRef,
    }
  }

  static async processWebhook(
    provider: string,
    body: unknown,
    signature?: string
  ): Promise<{ success: boolean; message: string }> {
    const providerInstance = this.getProvider()

    const isValidWebhook =
      (typeof providerInstance.validateCallback === 'function' &&
        providerInstance.validateCallback(body, signature)) ||
      (typeof providerInstance.verifyWebhookSignature === 'function' &&
        providerInstance.verifyWebhookSignature(body, signature))

    if (!isValidWebhook) {
      throw new Error('Invalid webhook signature')
    }

    const payload =
      typeof body === 'object' && body !== null
        ? body as Record<string, unknown>
        : {}

    let providerReference = ''
    let status: PrismaPaymentStatus | 'PENDING' = 'PENDING'

    switch (provider) {
      case 'midtrans': {
        const orderId =
          typeof payload.order_id === 'string'
            ? payload.order_id
            : ''

        const transactionId =
          typeof payload.transaction_id === 'string'
            ? payload.transaction_id
            : ''

        providerReference = orderId || transactionId

        const transactionStatus =
          typeof payload.transaction_status === 'string'
            ? payload.transaction_status
            : ''

        status =
          transactionStatus === 'settlement' ||
          transactionStatus === 'capture'
            ? 'PAID'
            : transactionStatus === 'expire'
              ? 'EXPIRED'
              : 'PENDING'

        break
      }

      case 'xendit': {
        providerReference =
          typeof payload.id === 'string'
            ? payload.id
            : ''

        const xenditStatus =
          typeof payload.status === 'string'
            ? payload.status
            : ''

        status =
          xenditStatus === 'PAID' ||
          xenditStatus === 'SETTLED'
            ? 'PAID'
            : xenditStatus === 'EXPIRED'
              ? 'EXPIRED'
              : 'PENDING'

        break
      }

      case 'tripay': {
        providerReference =
          typeof payload.reference === 'string'
            ? payload.reference
            : ''

        const tripayStatus =
          typeof payload.status === 'string'
            ? payload.status
            : ''

        status =
          tripayStatus === 'PAID' ||
          tripayStatus === 'SETTLED'
            ? 'PAID'
            : tripayStatus === 'EXPIRED'
              ? 'EXPIRED'
              : 'PENDING'

        break
      }

      case 'duitku': {
        providerReference =
          typeof payload.merchantOrderId === 'string'
            ? payload.merchantOrderId
            : typeof payload.Reference === 'string'
              ? payload.Reference
              : ''

        const statusCode =
          typeof payload.statusCode === 'string'
            ? payload.statusCode
            : ''

        status =
          statusCode === '00'
            ? 'PAID'
            : statusCode === '02'
              ? 'EXPIRED'
              : 'PENDING'

        break
      }

      default: {
        providerReference =
          typeof payload.providerReference === 'string'
            ? payload.providerReference
            : typeof payload.reference === 'string'
              ? payload.reference
              : ''

        const rawStatus =
          typeof payload.status === 'string'
            ? payload.status
            : 'PENDING'

        status = rawStatus as PrismaPaymentStatus
        break
      }
    }

    if (status === 'PAID') {
      if (!providerReference) {
        throw new Error('Provider reference tidak ditemukan')
      }

      const result = await this.processPaymentInternal(
        providerReference,
        provider
      )

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

      const transition = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: 'PENDING',
        },
        data: {
          status: 'PAID',
          reviewedAt: new Date(),
        },
      })

      if (transition.count === 0) {
        return {
          success: true,
          message: 'Payment already processed',
        }
      }

      await WalletService.addCoinsInTransaction(
        tx as Prisma.TransactionClient,
        payment.userId,
        payment.package.coins,
        'TOPUP',
        payment.id,
        `Auto topup ${payment.package.name} via ${provider}`
      )

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

  static async getPaymentStatus(paymentId: string) {
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

    if (
      payment.provider !== 'manual' &&
      payment.status === 'PENDING' &&
      payment.providerRef
    ) {
      const provider = this.getProvider()

      try {
        let result:
          | { status: string; metadata?: unknown }
          | undefined

        if (typeof provider.verifyPayment === 'function') {
          result = await provider.verifyPayment(payment.providerRef)
        } else if (typeof provider.getPaymentStatus === 'function') {
          result = await provider.getPaymentStatus(payment.providerRef)
        }

        if (result?.status === 'PAID' && payment.providerRef) {
          if (!payment.providerRef) {
  throw new Error('Provider reference tidak ditemukan')
}

await this.processPaymentInternal(
  payment.providerRef,
  payment.provider
)

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
        // Keep current payment status if provider verification fails.
      }
    }

    return payment
  }

  static async manualApprove(
    paymentId: string,
    adminUserId: string,
    note?: string
  ) {
    void adminUserId

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

      const transition = await tx.payment.updateMany({
        where: {
          id: paymentId,
          status: 'PENDING',
        },
        data: {
          status: 'PAID',
          reviewedAt: new Date(),
          adminNote: note,
        },
      })

      if (transition.count === 0) {
        throw new Error('Payment sudah diproses')
      }

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
  ) {
    void adminUserId

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

      const transition = await tx.payment.updateMany({
        where: {
          id: paymentId,
          status: 'PENDING',
        },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          adminNote: note,
        },
      })

      if (transition.count === 0) {
        throw new Error('Payment sudah diproses')
      }

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
