import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'
import { SeriesType } from '@prisma/client'

const requestSchema = z.object({
  title: z.string().min(1),
  type: z.enum([SeriesType.MANGA, SeriesType.MANHWA, SeriesType.MANHUA, SeriesType.NOVEL, SeriesType.ONE_SHOT]),
  source: z.string().optional(),
  message: z.string().optional(),
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
    const validated = requestSchema.parse(body)

    const request = await prisma.request.create({
      data: {
        userId: session.user.id,
        title: validated.title,
        type: validated.type,
        source: validated.source,
        message: validated.message,
      },
    })

    return NextResponse.json({
      success: true,
      data: request,
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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const status = url.searchParams.get('status') || 'PENDING'
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Number(url.searchParams.get('limit')) || 20

    const where: any = {}
    if (session.user.role !== 'ADMIN' && session.user.role !== 'FOUNDER') {
      where.userId = session.user.id
    } else {
      if (status) where.status = status
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.request.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        requests,
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
