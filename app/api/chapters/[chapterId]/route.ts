import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'

export async function GET(
  req: Request,
  { params }: { params: { chapterId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: params.chapterId,
        isPublished: true,
      },
      include: {
        images: { orderBy: { pageNumber: 'asc' } },
        series: true,
      },
    })

    if (!chapter) {
      return NextResponse.json(
        { success: false, message: 'Chapter tidak ditemukan' },
        { status: 404 }
      )
    }

    let hasAccess = true
    let waitUntil = null

    if (chapter.isPremium || chapter.isLocked) {
      if (!session) {
        return NextResponse.json(
          { success: false, message: 'Login diperlukan' },
          { status: 401 }
        )
      }

      const entitlement = await prisma.chapterEntitlement.findUnique({
        where: {
          userId_chapterId: {
            userId: session.user.id,
            chapterId: chapter.id,
          },
        },
      })

      const vip = await prisma.userVIP.findFirst({
        where: {
          userId: session.user.id,
          expiresAt: { gt: new Date() },
        },
      })

      hasAccess = !!entitlement || !!vip

      if (!hasAccess && chapter.waitEnabled) {
  const now = new Date()
  const existingWait = await prisma.chapterWait.findFirst({
    where: {
      userId: session.user.id,
      chapterId: chapter.id,
      expiresAt: { gt: now },
    },
  })

  if (existingWait) {
    waitUntil = existingWait.expiresAt
    hasAccess = false
  } else {
    const waitUntilDate = new Date(now.getTime() + chapter.waitSeconds * 1000)
    await prisma.chapterWait.create({
      data: {
        userId: session.user.id,
        chapterId: chapter.id,
        expiresAt: waitUntilDate,
      },
    })
    waitUntil = waitUntilDate
    hasAccess = false
  }
}

      if (!hasAccess && !waitUntil) {
        return NextResponse.json(
          {
            success: false,
            message: 'Chapter terkunci',
            requiresPayment: true,
            price: chapter.coinPrice,
            waitEnabled: chapter.waitEnabled,
            waitSeconds: chapter.waitSeconds,
          },
          { status: 403 }
        )
      }
    }

    if (session && hasAccess) {
      await prisma.readingProgress.upsert({
        where: {
          userId_seriesId_chapterId: {
            userId: session.user.id,
            seriesId: chapter.seriesId,
            chapterId: chapter.id,
          },
        },
        update: { lastReadAt: new Date() },
        create: {
          userId: session.user.id,
          seriesId: chapter.seriesId,
          chapterId: chapter.id,
          lastPage: 0,
        },
      })

      await prisma.readingHistory.upsert({
        where: {
          userId_seriesId_chapterId: {
            userId: session.user.id,
            seriesId: chapter.seriesId,
            chapterId: chapter.id,
          },
        },
        update: { lastReadAt: new Date() },
        create: {
          userId: session.user.id,
          seriesId: chapter.seriesId,
          chapterId: chapter.id,
        },
      })
    }

    if (hasAccess) {
      await prisma.chapter.update({
        where: { id: chapter.id },
        data: { views: { increment: 1 } },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        chapter,
        images: chapter.images,
        series: chapter.series,
        hasAccess,
        waitUntil,
        requiresPayment: !hasAccess && !waitUntil && (chapter.isPremium || chapter.isLocked),
        price: chapter.coinPrice,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
