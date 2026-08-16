import { prisma } from '@/lib/db/prisma'
import { TransactionType } from '@prisma/client'

export async function getWallet(userId: string) {
  let wallet = await prisma.coinWallet.findUnique({
    where: { userId },
  })

  if (!wallet) {
    wallet = await prisma.coinWallet.create({
      data: {
        userId,
        balance: 0,
      },
    })
  }

  return wallet
}

export async function getCoinBalance(userId: string) {
  const wallet = await getWallet(userId)

  return wallet.balance
}

export async function addCoins(
  userId: string,
  amount: number,
  type: TransactionType = 'BONUS',
  description?: string,
  referenceId?: string
) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Jumlah coin tidak valid')
  }

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.coinWallet.upsert({
      where: { userId },
      create: {
        userId,
        balance: 0,
      },
      update: {},
    })

    const newBalance = wallet.balance + amount

    const updatedWallet = await tx.coinWallet.update({
      where: { userId },
      data: {
        balance: newBalance,
      },
    })

    await tx.user.update({
      where: { id: userId },
      data: {
        coins: newBalance,
      },
    })

    await tx.coinTransaction.create({
      data: {
        userId,
        type,
        amount,
        balance: newBalance,
        description,
        referenceId,
      },
    })

    return updatedWallet
  })
}

export async function removeCoins(
  userId: string,
  amount: number,
  type: TransactionType = 'PURCHASE',
  description?: string,
  referenceId?: string
) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('Jumlah coin tidak valid')
  }

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.coinWallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      throw new Error('Wallet tidak ditemukan')
    }

    if (wallet.balance < amount) {
      throw new Error('Coin tidak cukup')
    }

    const newBalance = wallet.balance - amount

    const updatedWallet = await tx.coinWallet.update({
      where: { userId },
      data: {
        balance: newBalance,
      },
    })

    await tx.user.update({
      where: { id: userId },
      data: {
        coins: newBalance,
      },
    })

    await tx.coinTransaction.create({
      data: {
        userId,
        type,
        amount: -amount,
        balance: newBalance,
        description,
        referenceId,
      },
    })

    return updatedWallet
  })
}

export async function transferCoins(
  userId: string,
  amount: number,
  description?: string,
  referenceId?: string
) {
  return removeCoins(
    userId,
    amount,
    'PURCHASE',
    description,
    referenceId
  )
}

export async function refundCoins(
  userId: string,
  amount: number,
  description?: string,
  referenceId?: string
) {
  return addCoins(
    userId,
    amount,
    'REFUND',
    description,
    referenceId
  )
}

// Default export WalletService wrapper to satisfy imports expecting WalletService
const WalletService = {
  getWallet,
  getCoinBalance,
  addCoins,
  removeCoins,
  transferCoins,
  refundCoins,
}

export { WalletService }
export default WalletService
