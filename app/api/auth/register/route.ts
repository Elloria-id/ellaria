import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username hanya boleh berisi huruf, angka, dan underscore'
    ),

  email: z
    .string()
    .email(),

  password: z
    .string()
    .min(8),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const data = registerSchema.parse({
      username: String(body.username).trim(),
      email: String(body.email).toLowerCase().trim(),
      password: String(body.password),
    })

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: data.email,
          },
          {
            username: data.username,
          },
        ],
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    })

    if (existingUser) {
      if (existingUser.email === data.email) {
        return NextResponse.json(
          {
            success: false,
            message: 'Email sudah digunakan',
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Username sudah digunakan',
        },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(data.password, 12)

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: data.username,
          email: data.email,
          passwordHash,
          role: 'USER',
          coins: 0,
          exp: 0,
          level: 1,
        },
      })

      await tx.coinWallet.create({
        data: {
          userId: newUser.id,
          balance: 0,
        },
      })

      return newUser
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Akun berhasil dibuat',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Data pendaftaran tidak valid',
          errors: error.flatten(),
        },
        { status: 400 }
      )
    }

    console.error('REGISTER_ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan pada server',
      },
      { status: 500 }
    )
  }
}
