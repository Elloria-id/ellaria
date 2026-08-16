import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Silakan login terlebih dahulu' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unread') === 'true'
    const limit = Math.min(
      Math.max(Number(searchParams.get('limit')) || 20, 1),
      50
    )

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    })

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error('GET NOTIFICATIONS ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil notifikasi',
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Silakan login terlebih dahulu' },
        { status: 401 }
      )
    }

    const body = await req.json()

    const title =
      typeof body.title === 'string' ? body.title.trim() : ''

    const message =
      typeof body.message === 'string' ? body.message.trim() : ''

    const type =
      typeof body.type === 'string' ? body.type.trim() : 'SYSTEM'

    if (!title || !message) {
      return NextResponse.json(
        {
          success: false,
          message: 'Title dan message diperlukan',
        },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        userId: session.user.id,
        type,
        title,
        message,
        data: body.data ?? undefined,
      },
    })

    return NextResponse.json(
      {
        success: true,
        notification,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('CREATE NOTIFICATION ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal membuat notifikasi',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Silakan login terlebih dahulu' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const notificationId = searchParams.get('id')

    if (!notificationId) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID notifikasi diperlukan',
        },
        { status: 400 }
      )
    }

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

    await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Notifikasi dihapus',
    })
  } catch (error) {
    console.error('DELETE NOTIFICATION ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal menghapus notifikasi',
      },
      { status: 500 }
    )
  }
}
