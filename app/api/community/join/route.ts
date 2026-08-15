import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'

const joinSchema = z.object({
  communityId: z.string(),
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
    const validated = joinSchema.parse(body)

    const community = await prisma.community.findUnique({
      where: { id: validated.communityId },
    })

    if (!community) {
      return NextResponse.json(
        { success: false, message: 'Community tidak ditemukan' },
        { status: 404 }
      )
    }

    if (community.type === 'private') {
      return NextResponse.json(
        { success: false, message: 'Community ini private, membutuhkan undangan' },
        { status: 403 }
      )
    }

    const existing = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: validated.communityId,
          userId: session.user.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Anda sudah menjadi anggota' },
        { status: 400 }
      )
    }

    const member = await prisma.communityMember.create({
      data: {
        communityId: validated.communityId,
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: member,
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
