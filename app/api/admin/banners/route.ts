import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'

const bannerSchema = z.object({
  title: z.string().optional(),
  image: z.string(),
  link: z.string().optional(),
  order: z.number().default(0),
  isActive: z.boolean().default(true),
})

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const banners = await prisma.banner.findMany({
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: banners,
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
    if (!session || !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = bannerSchema.parse(body)

    const banner = await prisma.banner.create({
      data: validated,
    })

    return NextResponse.json({
      success: true,
      data: banner,
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

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'id diperlukan' },
        { status: 400 }
      )
    }

    const banner = await prisma.banner.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      success: true,
      data: banner,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'id diperlukan' },
        { status: 400 }
      )
    }

    await prisma.banner.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Banner dihapus',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
