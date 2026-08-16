import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { Role } from '@prisma/client'

async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return false

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, isBanned: true } })
  return Boolean(user && !user.isBanned && (user.role === Role.ADMIN || user.role === Role.FOUNDER))
}

export async function GET() {
  try {
    if (!(await isAdmin())) return NextResponse.json({ success: false, message: 'Tidak memiliki akses' }, { status: 403 })

    return NextResponse.json({ success: true, data: { siteName: 'Ellaria エル', waitSeconds: 6, coinPrice: 1 } })
  } catch {
    return NextResponse.json({ success: false, message: 'Gagal mengambil settings' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) return NextResponse.json({ success: false, message: 'Tidak memiliki akses' }, { status: 403 })

    const body = await req.json()

    const siteName = String(body.siteName || 'Ellaria エル')
    const waitSeconds = Math.max(0, Number(body.waitSeconds || 6))
    const coinPrice = Math.max(0, Number(body.coinPrice || 1))

    return NextResponse.json({ success: true, message: 'Settings diterima', data: { siteName, waitSeconds, coinPrice } })
  } catch {
    return NextResponse.json({ success: false, message: 'Gagal menyimpan settings' }, { status: 500 })
  }
}
