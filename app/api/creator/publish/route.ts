import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'

const publishSchema = z.object({
  seriesId: z.string().optional(),
  chapterId: z.string().optional(),
  published: z.boolean(),
})

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!['CREATOR', 'ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validated = publishSchema.parse(body)

    if (validated.seriesId) {
      const series = await prisma.series.findUnique({
        where: { id: validated.seriesId },
      })

      if (!series) {
        return NextResponse.json(
          { success: false, message: 'Series tidak ditemukan' },
          { status: 404 }
        )
      }

      if (series.ownerId !== session.user.id && !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
        return NextResponse.json(
          { success: false, message: 'Forbidden' },
          { status: 403 }
        )
      }

      await prisma.series.update({
        where: { id: validated.seriesId },
        data: { published: validated.published },
      })

      if (validated.published) {
        // Notify followers
        const followers = await prisma.follow.findMany({
          where: { followingId: session.user.id },
          include: { follower: true },
        })

        for (const follow of followers) {
          await prisma.notification.create({
            data: {
              userId: follow.followerId,
              type: 'NEW_SERIES',
              title: 'Series Baru',
              message: `${session.user.username} telah mempublikasikan series baru: ${series.title}`,
              data: { seriesId: series.id },
            },
          })
        }
      }
    }

    if (validated.chapterId) {
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

      if (chapter.series.ownerId !== session.user.id && !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
        return NextResponse.json(
          { success: false, message: 'Forbidden' },
          { status: 403 }
        )
      }

      await prisma.chapter.update({
        where: { id: validated.chapterId },
        data: { isPublished: validated.published },
      })

      if (validated.published) {
        // Notify followers
        const followers = await prisma.follow.findMany({
          where: { followingId: session.user.id },
          include: { follower: true },
        })

        for (const follow of followers) {
          await prisma.notification.create({
            data: {
              userId: follow.followerId,
              type: 'NEW_CHAPTER',
              title: 'Chapter Baru',
              message: `Chapter baru ${chapter.chapterNumber} dari ${chapter.series.title} telah dipublikasikan`,
              data: { seriesId: chapter.seriesId, chapterId: chapter.id },
            },
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Status publikasi diperbarui',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Input tidak valid' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
