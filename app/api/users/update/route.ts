import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .optional(),

  avatar: z
    .string()
    .url()
    .nullable()
    .optional(),

  bio: z
    .string()
    .max(500)
    .nullable()
    .optional(),

  show18Plus: z
    .boolean()
    .optional(),
})

export async function PATCH(req: Request) {
  try {
    const session =
      await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    const body = await req.json()
    const data = updateSchema.parse(body)

    if (data.username) {
      const existing =
        await prisma.user.findFirst({
          where: {
            username: data.username,
            NOT: {
              id: session.user.id,
            },
          },
        })

      if (existing) {
        return NextResponse.json(
          {
            success: false,
            message: 'Username sudah digunakan',
          },
          { status: 409 }
        )
      }
    }

    const user =
      await prisma.user.update({
        where: {
          id: session.user.id,
        },
        data,
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          bio: true,
          role: true,
          show18Plus: true,
          exp: true,
          level: true,
          followersCount: true,
          followingCount: true,
        },
      })

    return NextResponse.json({
      success: true,
      message: 'Profile berhasil diperbarui',
      data: user,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Data profile tidak valid',
        },
        { status: 400 }
      )
    }

    console.error(
      'PATCH /api/users/update:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal memperbarui profile',
      },
      { status: 500 }
    )
  }
}
