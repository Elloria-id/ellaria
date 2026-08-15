import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { StorageProvider } from '@/lib/storage/StorageProvider'
import { LocalStorageProvider } from '@/lib/storage/LocalStorage'
import { R2StorageProvider } from '@/lib/storage/R2Storage'
import { z } from 'zod'

const uploadSchema = z.object({
  file: z.string(), // base64
  fileName: z.string(),
  mimeType: z.string(),
  folder: z.enum(['proofs', 'covers', 'chapters']).default('proofs'),
})

let storageProvider: StorageProvider
const provider = process.env.STORAGE_PROVIDER || 'local'

if (provider === 'r2') {
  try {
    storageProvider = new R2StorageProvider()
  } catch {
    // Fallback ke local jika R2 gagal
    storageProvider = new LocalStorageProvider()
  }
} else {
  storageProvider = new LocalStorageProvider()
}

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

    const timestamp = Date.now()
    const uniqueId = `${session.user.id}-${timestamp}`
    const fileExt = validated.fileName.split('.').pop() || 'jpg'
    const storageKey = `${validated.folder}/${uniqueId}.${fileExt}`

    const buffer = Buffer.from(base64Data, 'base64')
    const url = await storageProvider.upload(storageKey, buffer, validated.mimeType)

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
