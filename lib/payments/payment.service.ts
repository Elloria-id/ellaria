import { prisma } from '@/lib/db/prisma'
import { WalletService } from '@/lib/coins/wallet.service'
import { PaymentProvider } from './PaymentProvider'
import { ManualQRISProvider } from './ManualQRIS'
import { MidtransProvider } from './Midtrans'
import { XenditProvider } from './Xendit'
import { TripayProvider } from './Tripay'
import { DuitkuProvider } from './Duitku'

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

  static async createPayment(
    userId: string,
    packageId: string,
    metadata?: any
  ) {
    const provider = this.getProvider()
    const packageData = await prisma.coinPackage.findUnique({
      where: { id: packageId },
    })

    if (!packageData) {
      throw new Error('Paket tidak ditemukan')
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        packageId,
        amount: packageData.price,
        status: 'PENDING',
        provider: provider.name,
      },
    })

    // Create payment with provider
    const providerResult = await provider.createPayment(
      userId,
      packageId,
      packageData.price,
      {
        ...metadata,
        description: packageData.name,
      }
    )

    // Update payment with provider reference
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerReference: providerResult.providerReference,
        paymentUrl: providerResult.paymentUrl,
        qrImage: providerResult.qrImage,
      },
    })

    return {
      ...payment,
      ...providerResult,
    }
  }

  static async processWebhook(
    provider: string,
    body: any,
    signature: string
  ): Promise<{ success: boolean; message: string }> {
    const providerInstance = this.getProvider()

    // Verify signature
    if (!providerInstance.verifyWebhookSignature(body, signature)) {
      throw new Error('Invalid webhook signature')
    }

    // Extract provider reference from body (depends on provider)
    let providerReference = ''
    let status = ''

    switch (provider) {
      case 'midtrans':
        providerReference = body.order_id
        status = body.transaction_status === 'settlement' || body.transaction_status === 'capture'
          ? 'PAID'
          : body.transaction_status === 'expire'
          ? 'EXPIRED'
          : 'PENDING'
        break
      case 'xendit':
        providerReference = body.id
        status = body.status === 'PAID' || body.status === 'SETTLED'
          ? 'PAID'
          : body.status === 'EXPIRED'
          ? 'EXPIRED'
          : 'PENDING'
        break
      case 'tripay':
        providerReference = body.reference
        status = body.status === 'PAID' || body.status === 'SETTLED'
          ? 'PAID'
          : body.status === 'EXPIRED'
          ? 'EXPIRED'
          : 'PENDING'
        break
      case 'duitku':
        providerReference = body.merchantOrderId
        status = body.statusCode === '00'
          ? 'PAID'
          : body.statusCode === '02'
          ? 'EXPIRED'
          : 'PENDING'
        break
      default:
        throw new Error('Unsupported provider')
    }

    // Process payment if PAID (idempotent)
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
      // Find payment
      const payment = await tx.payment.findFirst({
        where: {
          providerReference,
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

      // Add coins to wallet
      await WalletService.addCoinsInTransaction(
        tx,
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
    if (payment.provider !== 'manual' && payment.status === 'PENDING' && payment.providerReference) {
      const provider = this.getProvider()
      try {
        const result = await provider.verifyPayment(payment.providerReference)
        if (result.status === 'PAID') {
          await this.processPaymentInternal(payment.providerReference, payment.provider)
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
        tx,
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
