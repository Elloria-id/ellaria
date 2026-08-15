import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'

const communitySchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().optional(),
  type: z.enum(['global', 'group', 'private']).default('group'),
})

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
    const type = url.searchParams.get('type') // global, group, private
    const page = Number(url.searchParams.get('page')) || 1
    const limit = Number(url.searchParams.get('limit')) || 20

    const where: any = { isActive: true }
    if (type) where.type = type

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { members: true, messages: true },
          },
          members: {
            where: { userId: session.user.id },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.community.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        communities,
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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Hanya CREATOR, ADMIN, FOUNDER yang bisa buat community
    if (!['CREATOR', 'ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validated = communitySchema.parse(body)

    const community = await prisma.community.create({
      data: {
        name: validated.name,
        description: validated.description,
        type: validated.type,
      },
    })

    await prisma.communityMember.create({
      data: {
        communityId: community.id,
        userId: session.user.id,
        role: 'ADMIN',
      },
    })

    return NextResponse.json({
      success: true,
      data: community,
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
