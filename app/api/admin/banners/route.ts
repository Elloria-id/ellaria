import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { Role } from '@prisma/client'

async function isAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) return false

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBanned: true },
  })

  return !!(
    user &&
    !user.isBanned &&
    [Role.ADMIN, Role.FOUNDER].includes(user.role)
  )
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, message: 'Tidak memiliki akses' },
        { status: 403 }
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
    console.error(error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil banner',
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, message: 'Tidak memiliki akses' },
        { status: 403 }
      )
    }

    const body = await req.json()

    const title = String(body.title || '').trim()
    const image = String(body.image || '').trim()
    const link = String(body.link || '').trim()
    const order = Number(body.order || 0)

    if (!title || !image) {
      return NextResponse.json(
        {
          success: false,
          message: 'Title dan image wajib diisi',
        },
        { status: 400 }
      )
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        image,
        link: link || null,
        order: Number.isFinite(order) ? order : 0,
        active: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: banner,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal membuat banner',
      },
      { status: 500 }
    )
  }
}
