import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { WalletService } from '@/lib/coins/wallet.service'
import { z } from 'zod'

const unlockSchema = z.object({
  chapterId: z.string(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = unlockSchema.parse(body)

    const chapter = await prisma.chapter.findUnique({
      where: { id: validated.chapterId },
      include: { series: true },
    })

    if (!chapter) {
      return NextResponse.json(
        { success: false, message: 'Chapter tidak ditemukan' },
        { status: 404 }
      )
    }

    if (!chapter.isPremium && !chapter.isLocked) {
      return NextResponse.json(
        { success: false, message: 'Chapter ini gratis' },
        { status: 400 }
      )
    }

    const existing = await prisma.chapterEntitlement.findUnique({
      where: {
        userId_chapterId: {
          userId: session.user.id,
          chapterId: chapter.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Chapter sudah terbuka',
      })
    }

    const vip = await prisma.userVIP.findFirst({
      where: {
        userId: session.user.id,
        expiresAt: { gt: new Date() },
      },
    })

    if (vip) {
      await prisma.chapterEntitlement.create({
        data: {
          userId: session.user.id,
          chapterId: chapter.id,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Chapter terbuka (VIP)',
      })
    }

    const balance = await WalletService.spendCoins(
      session.user.id,
      chapter.coinPrice,
      chapter.id,
      `Unlock chapter ${chapter.chapterNumber} - ${chapter.series.title}`
    )

    await prisma.chapterEntitlement.create({
      data: {
        userId: session.user.id,
        chapterId: chapter.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Chapter terbuka',
      remainingBalance: balance,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Input tidak valid' },
        { status: 400 }
      )
    }
    if (error instanceof Error && error.message === 'Saldo tidak cukup') {
      return NextResponse.json(
        { success: false, message: 'Saldo tidak cukup' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
      }
