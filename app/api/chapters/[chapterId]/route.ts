import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

type Params = {
  params: {
    chapterId: string
  }
}

export async function GET(
  _req: Request,
  { params }: Params
) {
  try {
    const chapter =
      await prisma.chapter.findUnique({
        where: {
          id: params.chapterId,
        },
        include: {
          series: true,
        },
      })

    if (!chapter) {
      return NextResponse.json(
        {
          success: false,
          message: 'Chapter tidak ditemukan',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: chapter,
    })
  } catch (error) {
    console.error(
      'CHAPTER API ERROR:',
      error
    )

    return NextResponse.json(
      {
        success: false,
        message: 'Gagal mengambil chapter',
      },
      { status: 500 }
    )
  }
}
