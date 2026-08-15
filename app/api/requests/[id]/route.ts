import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'COMPLETED']),
  note: z.string().optional(),
})

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admin can update status
    if (!['ADMIN', 'FOUNDER'].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validated = updateSchema.parse(body)

    const request = await prisma.request.update({
      where: { id: params.id },
      data: {
        status: validated.status,
        adminNote: validated.note,
        updatedAt: new Date(),
      },
    })

    // Notify user
    await prisma.notification.create({
      data: {
        userId: request.userId,
        type: 'REQUEST_UPDATED',
        title: 'Status Request Diperbarui',
        message: `Request "${request.title}" telah ${validated.status.toLowerCase()}`,
      },
    })

    return NextResponse.json({
      success: true,
      data: request,
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
