import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { WatermarkService } from '@/lib/watermark/watermark.service'
import { z } from 'zod'

const watermarkSchema = z.object({
  image: z.string(), // base64
  userId: z.string(),
  username: z.string(),
  timestamp: z.number(),
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
    const validated = watermarkSchema.parse(body)

    // Verify user can watermark this image
    if (validated.userId !== session.user.id && !['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const base64Data = validated.image.split(',')[1] || validated.image
    const buffer = Buffer.from(base64Data, 'base64')

    const watermarkedBuffer = await WatermarkService.applyWatermark(
      buffer,
      validated.userId,
      validated.username,
      validated.timestamp
    )

    const watermarkedBase64 = watermarkedBuffer.toString('base64')

    return NextResponse.json({
      success: true,
      data: {
        image: `data:image/webp;base64,${watermarkedBase64}`,
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
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
