import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { Role } from '@prisma/client'

async function requireAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return false

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, isBanned: true } })
  return Boolean(user && !user.isBanned && (user.role === Role.ADMIN || user.role === Role.FOUNDER))
}

export async function GET() {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ success: false, message: 'Tidak memiliki akses' }, { status: 403 })

    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, username: true, email: true } },
      },
    })

    return NextResponse.json({ success: true, data: payments })
  } catch (error) {
    console.error('ADMIN PAYMENTS GET ERROR:', error)
    return NextResponse.json({ success: false, message: 'Gagal mengambil pembayaran' }, { status: 500 })
  }
}
