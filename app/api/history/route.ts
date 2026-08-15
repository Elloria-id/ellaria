import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const limit = Number(url.searchParams.get('limit')) || 50
    const type = url.searchParams.get('type') // MANGA, MANHWA, etc

    const where: any = { userId: session.user.id }
    if (type) {
      where.series = { type }
    }

    const history = await prisma.readingHistory.findMany({
      where,
      include: {
        series: {
          include: {
            genres: { include: { genre: true } },
          },
        },
        chapter: true,
      },
      orderBy: { lastReadAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: history,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(req.url)
    const all = url.searchParams.get('all')
    const id = url.searchParams.get('id')

    if (all === 'true') {
      await prisma.readingHistory.deleteMany({
        where: { userId: session.user.id },
      })
    } else if (id) {
      const history = await prisma.readingHistory.findFirst({
        where: {
          id,
          userId: session.user.id,
        },
      })

      if (!history) {
        return NextResponse.json(
          { success: false, message: 'History tidak ditemukan' },
          { status: 404 }
        )
      }

      await prisma.readingHistory.delete({
        where: { id },
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Parameter tidak valid' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'History dihapus',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
