import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { getStorageProvider } from '@/lib/storage/provider'
import { prisma } from '@/lib/db/prisma'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const uploadSchema = z.object({
  file: z.string(), // base64
  fileName: z.string(),
  mimeType: z.string(),
  folder: z.enum(['proofs', 'covers', 'chapters']).default('proofs'),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = uploadSchema.parse(body)

    if (
      validated.folder === 'chapters'
    ) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, isBanned: true },
      })

      if (
        !user ||
        user.isBanned ||
        (user.role !== Role.ADMIN && user.role !== Role.FOUNDER)
      ) {
      return NextResponse.json(
        { success: false, message: 'Hanya admin atau founder yang dapat mengupload halaman chapter' },
        { status: 403 }
      )
      }
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(validated.mimeType)) {
      return NextResponse.json(
        { success: false, message: 'Format file tidak didukung. Gunakan JPEG, PNG, atau WebP' },
        { status: 400 }
      )
    }

    const base64Data = validated.file.split(',')[1] || validated.file
    const fileSize = Buffer.from(base64Data, 'base64').length
    if (fileSize > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'Ukuran file maksimal 5MB' },
        { status: 400 }
      )
    }

    const uniqueId = `${session.user.id}-${randomUUID()}`
    const fileExt =
      validated.mimeType === 'image/png'
        ? 'png'
        : validated.mimeType === 'image/webp'
          ? 'webp'
          : 'jpg'
    const storageKey = `${validated.folder}/${uniqueId}.${fileExt}`

    const buffer = Buffer.from(base64Data, 'base64')
    const url = await getStorageProvider().upload(
      storageKey,
      buffer,
      validated.mimeType
    )

    return NextResponse.json({
      success: true,
      data: {
        url,
        storageKey,
        fileName: validated.fileName,
        mimeType: validated.mimeType,
        size: fileSize,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Input tidak valid' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Upload gagal: ' + (error as Error).message },
      { status: 500 }
    )
  }
}
