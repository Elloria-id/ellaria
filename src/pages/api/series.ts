import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  if (method === 'GET') {
    const series = await prisma.series.findMany({ take: 30, orderBy: { createdAt: 'desc' } })
    return res.status(200).json(series)
  }
  res.status(405).end()
}
