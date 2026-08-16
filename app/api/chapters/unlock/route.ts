import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { removeCoins } from '@/lib/coins/wallet.service'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    const body = await req.json()
    const chapterId = body?.chapterId

    if (!chapterId || typeof chapterId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          message: 'chapterId wajib diisi',
        },
        { status: 400 }
      )
    }

    const userId = session.user.id

    const chapter = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
      },
      include: {
        series: true,
      },
    })

    if (!chapter) {
      return NextResponse.json(
        {
          success: false,
          message: 'Chapter tidak ditemukan',
        },
        { status: 404 }
      )
    }

    if (!chapter.isPublished) {
      return NextResponse.json(
        {
          success: false,
          message: 'Chapter belum diterbitkan',
        },
        { status: 403 }
      )
    }

    const existingEntitlement =
      await prisma.chapterEntitlement.findUnique({
        where: {
          userId_chapterId: {
            userId,
            chapterId,
          },
        },
      })

    if (existingEntitlement) {
      return NextResponse.json({
        success: true,
        message: 'Chapter sudah terbuka',
        unlocked: true,
        alreadyUnlocked: true,
      })
    }

    if (!chapter.isPremium && !chapter.isLocked) {
      await prisma.chapterEntitlement.create({
        data: {
          userId,
          chapterId,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Chapter berhasil dibuka',
        unlocked: true,
        cost: 0,
      })
    }

    const cost = Math.max(0, chapter.coinPrice)

    if (cost === 0) {
      await prisma.chapterEntitlement.create({
        data: {
          userId,
          chapterId,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Chapter berhasil dibuka',
        unlocked: true,
        cost: 0,
      })
    }

    const wallet = await prisma.coinWallet.findUnique({
      where: {
        userId,
      },
    })

    if (!wallet || wallet.balance < cost) {
      return NextResponse.json(
        {
          success: false,
          message: 'Coin tidak cukup',
          required: cost,
          balance: wallet?.balance ?? 0,
        },
        { status: 402 }
      )
    }

    const updatedWallet = await removeCoins(
      userId,
      cost,
      'PURCHASE',
      `Unlock chapter ${chapter.chapterNumber} - ${chapter.series.title}`,
      chapter.id
    )

    await prisma.chapterEntitlement.create({
      data: {
        userId,
        chapterId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Chapter berhasil dibuka',
      unlocked: true,
      alreadyUnlocked: false,
      cost,
      balance: updatedWallet.balance,
    })
  } catch (error) {
    console.error('POST /api/chapters/unlock error:', error)

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Gagal membuka chapter',
      },
      { status: 500 }
    )
  }
}
