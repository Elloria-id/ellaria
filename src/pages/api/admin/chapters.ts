import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (req.method === 'POST') {
    const { seriesId, title, number, images } = req.body
    if (!seriesId || !title || number == null) return res.status(400).json({ error: 'Missing fields' })
    const created = await prisma.chapter.create({ data: { seriesId, title, number: parseFloat(number), images: images || [] } })
    return res.status(201).json(created)
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'Missing id' })
    await prisma.chapter.delete({ where: { id } })
    return res.status(200).json({ ok: true })
  }

  // GET chapters by seriesId
  if (req.method === 'GET') {
    const { seriesId } = req.query
    if (!seriesId || Array.isArray(seriesId)) return res.status(400).json({ error: 'Missing seriesId' })
    const chapters = await prisma.chapter.findMany({ where: { seriesId }, orderBy: { number: 'asc' } })
    return res.status(200).json(chapters)
  }

  res.status(405).end()
}
