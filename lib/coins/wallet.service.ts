import { prisma } from '@/lib/db/prisma'
import { TransactionType, Prisma } from '@prisma/client'

export class WalletService {
  static async getBalance(userId: string): Promise<number> {
    const wallet = await prisma.coinWallet.findUnique({
      where: { userId },
    })
    return wallet?.balance || 0
  }

  static async addCoinsInTransaction(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: number,
    type: TransactionType,
    referenceId?: string,
    description?: string
  ): Promise<number> {
    let wallet = await tx.coinWallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      wallet = await tx.coinWallet.create({
        data: {
          userId,
          balance: 0,
        },
      })
    }

    const newBalance = wallet.balance + amount
    await tx.coinWallet.update({
      where: { userId },
      data: { balance: newBalance },
    })

    await tx.coinTransaction.create({
      data: {
        userId,
        type,
        amount,
        balance: newBalance,
        referenceId,
        description,
      },
    })

    return newBalance
  }

  static async addCoins(
    userId: string,
    amount: number,
    type: TransactionType,
    referenceId?: string,
    description?: string
  ): Promise<number> {
    return await prisma.$transaction(async (tx) => {
      return this.addCoinsInTransaction(tx, userId, amount, type, referenceId, description)
    })
  }

  static async spendCoins(
    userId: string,
    amount: number,
    referenceId?: string,
    description?: string
  ): Promise<number> {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.coinWallet.findUnique({
        where: { userId },
      })

      if (!wallet) {
        throw new Error('Wallet tidak ditemukan')
      }

      if (wallet.balance < amount) {
        throw new Error('Saldo tidak cukup')
      }

      const newBalance = wallet.balance - amount
      await tx.coinWallet.update({
        where: { userId },
        data: { balance: newBalance },
      })

      await tx.coinTransaction.create({
        data: {
          userId,
          type: TransactionType.PURCHASE,
          amount: -amount,
          balance: newBalance,
          referenceId,
          description,
        },
      })

      return newBalance
    })
  }

  static async getTransactions(userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit
    const [transactions, total] = await Promise.all([
      prisma.coinTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.coinTransaction.count({ where: { userId } }),
    ])

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }
}
