import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = registerSchema.parse(body)

    const result = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findFirst({
        where: {
          OR: [{ email: validated.email }, { username: validated.username }],
        },
      })

      if (existingUser) {
        throw new Error('Email atau username sudah digunakan')
      }

      const passwordHash = await bcrypt.hash(validated.password, 10)

      const user = await tx.user.create({
        data: {
          username: validated.username,
          email: validated.email,
          passwordHash,
          role: 'USER',
        },
      })

      await tx.coinWallet.create({
        data: {
          userId: user.id,
          balance: 0,
        },
      })

      return user
    })

    return NextResponse.json({
      success: true,
      message: 'Akun berhasil dibuat',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Input tidak valid' },
        { status: 400 }
      )
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
