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

    const genres = await prisma.genre.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: genres,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil genre',
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

    const name = String(body.name || '').trim()
    const slug = String(body.slug || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')

    if (!name || !slug) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nama genre wajib diisi',
        },
        { status: 400 }
      )
    }

    const genre = await prisma.genre.create({
      data: {
        name,
        slug,
      },
    })

    return NextResponse.json({
      success: true,
      data: genre,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal membuat genre',
      },
      { status: 500 }
    )
  }
}
