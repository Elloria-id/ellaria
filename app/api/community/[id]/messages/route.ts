import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const messageSchema = z.object({
  content: z.string().min(1).max(3000),
  replyToId: z.string().optional(),
})

type Params = {
  params: {
    id: string
  }
}

export async function GET(
  req: Request,
  { params }: Params
) {
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

    const membership =
      await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: params.id,
            userId: session.user.id,
          },
        },
      })

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          message: 'Kamu belum bergabung ke komunitas ini',
        },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)

    const limit = Math.min(
      Math.max(Number(searchParams.get('limit')) || 50, 1),
      100
    )

    const messages = await prisma.chatMessage.findMany({
      where: {
        communityId: params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true,
            level: true,
          },
        },
        replyTo: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      messages,
    })
  } catch (error) {
    console.error('GET COMMUNITY MESSAGES ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil pesan',
      },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: Params
) {
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

    const membership =
      await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: params.id,
            userId: session.user.id,
          },
        },
      })

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          message: 'Kamu belum bergabung ke komunitas ini',
        },
        { status: 403 }
      )
    }

    const body = await req.json()
    const data = messageSchema.parse(body)

    if (data.replyToId) {
      const parent =
        await prisma.chatMessage.findFirst({
          where: {
            id: data.replyToId,
            communityId: params.id,
          },
        })

      if (!parent) {
        return NextResponse.json(
          {
            success: false,
            message: 'Pesan yang dibalas tidak ditemukan',
          },
          { status: 404 }
        )
      }
    }

    const message = await prisma.chatMessage.create({
      data: {
        communityId: params.id,
        userId: session.user.id,
        content: data.content,
        replyToId: data.replyToId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true,
            level: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Isi pesan tidak valid',
        },
        { status: 400 }
      )
    }

    console.error('SEND COMMUNITY MESSAGE ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengirim pesan',
      },
      { status: 500 }
    )
  }
}
