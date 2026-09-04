import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import crypto from 'crypto'

// TODO: Hapus file ini segera setelah Founder pertama berhasil dibuat.
//       Jangan biarkan endpoint bootstrap ini permanen di produksi.

export const dynamic = 'force-dynamic'

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store',
    },
  })
}

export async function GET() {
  return jsonResponse({ success: false, message: 'Method not allowed' }, 405)
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const emailRaw = body?.email
    const keyRaw = body?.key

    if (!emailRaw || !keyRaw) {
      return jsonResponse({ success: false, message: 'Email dan key diperlukan' }, 400)
    }

    const email = String(emailRaw).toLowerCase().trim()
    const providedKey = String(keyRaw)

    const envKey = process.env.FOUNDER_BOOTSTRAP_KEY
    if (!envKey) {
      // If environment variable is not set, fail safe.
      return jsonResponse({ success: false, message: 'Bootstrap key tidak tersedia di server' }, 500)
    }

    // Constant-time compare using hash -> avoid leaking via timing.
    const hash = (s: string) => crypto.createHash('sha256').update(s, 'utf8').digest()
    const providedHash = hash(providedKey)
    const envHash = hash(envKey)

    // timingSafeEqual requires equal length buffers
    if (providedHash.length !== envHash.length || !crypto.timingSafeEqual(providedHash, envHash)) {
      return jsonResponse({ success: false, message: 'Bootstrap key salah' }, 403)
    }

    // Find existing user by email. DO NOT create a new user.
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return jsonResponse({ success: false, message: 'User tidak ditemukan' }, 404)
    }

    // If already FOUNDER, return success (idempotent).
    if (user.role === 'FOUNDER') {
      return jsonResponse({ success: true, message: 'User sudah memiliki role FOUNDER' }, 200)
    }

    // Update only the role. Never touch passwordHash or other sensitive fields.
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'FOUNDER',
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    })

    return jsonResponse({ success: true, message: 'Role FOUNDER berhasil diaktifkan', user: updated }, 200)
  } catch (err) {
    console.error('FOUNDER BOOTSTRAP ERROR:', err)
    return jsonResponse({ success: false, message: 'Terjadi kesalahan server' }, 500)
  }
}
