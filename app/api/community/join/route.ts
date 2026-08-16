import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const schema = z.object({
  communityId: z.string().min(1),
})

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
    const { communityId } = schema.parse(body)

    const community = await prisma.community.findFirst({
      where: {
        id: communityId,
        isActive: true,
      },
    })

    if (!community) {
      return NextResponse.json(
        {
          success: false,
          message: 'Komunitas tidak ditemukan',
        },
        { status: 404 }
      )
    }

    const existingMember =
      await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId,
            userId: session.user.id,
          },
        },
      })

    if (existingMember) {
      return NextResponse.json({
        success: true,
        joined: true,
        message: 'Kamu sudah bergabung',
      })
    }

    await prisma.communityMember.create({
      data: {
        communityId,
        userId: session.user.id,
        role: 'MEMBER',
      },
    })

    return NextResponse.json({
      success: true,
      joined: true,
      message: 'Berhasil bergabung ke komunitas',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Community ID tidak valid',
        },
        { status: 400 }
      )
    }

    console.error('JOIN COMMUNITY ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal bergabung ke komunitas',
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
        {
          success: false,
          message: 'Silakan login terlebih dahulu',
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const communityId = searchParams.get('communityId')

    if (!communityId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Community ID diperlukan',
        },
        { status: 400 }
      )
    }

    const membership =
      await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId,
            userId: session.user.id,
          },
        },
      })

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          message: 'Kamu bukan anggota komunitas ini',
        },
        { status: 404 }
      )
    }

    if (membership.role === 'OWNER') {
      return NextResponse.json(
        {
          success: false,
          message:
            'Owner tidak dapat keluar. Pindahkan kepemilikan terlebih dahulu.',
        },
        { status: 400 }
      )
    }

    await prisma.communityMember.delete({
      where: {
        id: membership.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Berhasil keluar dari komunitas',
    })
  } catch (error) {
    console.error('LEAVE COMMUNITY ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal keluar dari komunitas',
      },
      { status: 500 }
    )
  }
}
