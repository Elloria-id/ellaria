import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const setupSecret = process.env.FOUNDER_SETUP_SECRET

    if (!setupSecret) {
      return NextResponse.json(
        {
          success: false,
          message:
            'FOUNDER_SETUP_SECRET belum dikonfigurasi di environment.',
        },
        { status: 500 }
      )
    }

    const body = await req.json()

    const { secret, username, email, password } = body

    if (!secret || secret !== setupSecret) {
      return NextResponse.json(
        {
          success: false,
          message: 'Secret setup tidak valid.',
        },
        { status: 401 }
      )
    }

    if (!username || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Username, email, dan password wajib diisi.',
        },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Password minimal 8 karakter.',
        },
        { status: 400 }
      )
    }

    const existingFounder =
      await prisma.user.findFirst({
        where: {
          role: 'FOUNDER',
        },
        select: {
          id: true,
        },
      })

    if (existingFounder) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Akun FOUNDER sudah ada. Setup Founder tidak dapat digunakan lagi.',
        },
        { status: 409 }
      )
    }

    const existingUser =
      await prisma.user.findFirst({
        where: {
          OR: [
            {
              email: email.toLowerCase(),
            },
            {
              username,
            },
          ],
        },
        select: {
          id: true,
        },
      })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Email atau username sudah digunakan.',
        },
        { status: 409 }
      )
    }

    const passwordHash =
      await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        username,
        email: email.toLowerCase(),
        passwordHash,
        role: 'FOUNDER',
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message:
          'Akun FOUNDER berhasil dibuat.',
        data: user,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error(
      'Setup Founder error:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        message:
          'Gagal membuat akun FOUNDER.',
      },
      { status: 500 }
    )
  }
}
