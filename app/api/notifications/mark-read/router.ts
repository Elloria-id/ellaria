import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Silakan login terlebih dahulu',
        },
        { status: 401 }
      )
    }

    const body = await req.json()

    const notificationId =
      typeof body.notificationId === 'string'
        ? body.notificationId
        : null

    if (notificationId) {
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: session.user.id,
        },
      })

      if (!notification) {
        return NextResponse.json(
          {
            success: false,
            message: 'Notifikasi tidak ditemukan',
          },
          { status: 404 }
        )
      }

      await prisma.notification.update({
        where: {
          id: notificationId,
        },
        data: {
          isRead: true,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Notifikasi ditandai sudah dibaca',
      })
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Semua notifikasi ditandai sudah dibaca',
    })
  } catch (error) {
    console.error('MARK NOTIFICATION READ ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal memperbarui notifikasi',
      },
      { status: 500 }
    )
  }
}
