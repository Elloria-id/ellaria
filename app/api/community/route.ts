import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
  type: z.enum(['global', 'group', 'private']).default('group'),
  avatar: z.string().url().optional(),
})

export async function GET() {
  try {
    const communities = await prisma.community.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      communities,
    })
  } catch (error) {
    console.error('GET COMMUNITY ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil komunitas',
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
        {
          success: false,
          message: 'Silakan login terlebih dahulu',
        },
        { status: 401 }
      )
    }

    const body = await req.json()
    const data = createSchema.parse(body)

    const community = await prisma.community.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        avatar: data.avatar,
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Komunitas berhasil dibuat',
        community,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Data komunitas tidak valid',
          errors: error.flatten(),
        },
        { status: 400 }
      )
    }

    console.error('CREATE COMMUNITY ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal membuat komunitas',
      },
      { status: 500 }
    )
  }
}
