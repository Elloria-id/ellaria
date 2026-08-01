import prisma from '@/lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query
  if (!slug || Array.isArray(slug)) return res.status(400).end()
  const series = await prisma.series.findUnique({ where: { slug }, include: { chapters: { orderBy: { number: 'asc' } } } })
  if (!series) return res.status(404).json({ error: 'Not found' })
  res.status(200).json(series)
}
