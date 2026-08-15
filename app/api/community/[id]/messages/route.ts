import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
  replyToId: z.string().optional(),
})

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const communityId = params.id
    const url = new URL(req.url)
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Number(url.searchParams.get('limit')) || 50

    // Check membership
    const member = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: session.user.id,
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { success: false, message: 'Anda bukan anggota community ini' },
        { status: 403 }
      )
    }

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { communityId },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              role: true,
            },
          },
          replyTo: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.chatMessage.count({ where: { communityId } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const communityId = params.id
    const body = await req.json()
    const validated = messageSchema.parse(body)

    // Check membership
    const member = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: session.user.id,
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { success: false, message: 'Anda bukan anggota community ini' },
        { status: 403 }
      )
    }

    const message = await prisma.chatMessage.create({
      data: {
        communityId,
        userId: session.user.id,
        content: validated.content,
        replyToId: validated.replyToId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: message,
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const messageId = url.searchParams.get('messageId')

    if (!messageId) {
      return NextResponse.json(
        { success: false, message: 'messageId diperlukan' },
        { status: 400 }
      )
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
    })

    if (!message) {
      return NextResponse.json(
        { success: false, message: 'Pesan tidak ditemukan' },
        { status: 404 }
      )
    }

    // Only owner or admin can delete
    const isOwner = message.userId === session.user.id
    const isModerator = ['ADMIN', 'FOUNDER', 'MODERATOR'].includes(session.user.role)

    if (!isOwner && !isModerator) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    await prisma.chatMessage.delete({
      where: { id: messageId },
    })

    return NextResponse.json({
      success: true,
      message: 'Pesan dihapus',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
