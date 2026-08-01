import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (req.method === 'GET') {
    const series = await prisma.series.findMany({ orderBy: { createdAt: 'desc' } })
    return res.status(200).json(series)
  }

  if (req.method === 'POST') {
    const { title, slug, synopsis } = req.body
    if (!title || !slug) return res.status(400).json({ error: 'Missing fields' })
    const created = await prisma.series.create({ data: { title, slug, synopsis: synopsis || '', status: 'Ongoing', type: 'Manga' } })
    return res.status(201).json(created)
  }

  if (req.method === 'DELETE') {
    const { id } = req.body
    if (!id) return res.status(400).json({ error: 'Missing id' })
    await prisma.chapter.deleteMany({ where: { seriesId: id } })
    await prisma.series.delete({ where: { id } })
    return res.status(200).json({ ok: true })
  }

  res.status(405).end()
}
