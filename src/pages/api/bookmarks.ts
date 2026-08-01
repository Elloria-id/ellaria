import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const method = req.method
  if (method === 'GET') {
    // list bookmarks for user
    // @ts-ignore
    const userEmail = session.user.email
    const user = await prisma.user.findUnique({ where: { email: userEmail || undefined } })
    if (!user) return res.status(404).json([])
    const bookmarks = await prisma.bookmark.findMany({ where: { userId: user.id }, include: { series: true } })
    return res.status(200).json(bookmarks)
  }

  if (method === 'POST') {
    // create/update bookmark
    // @ts-ignore
    const userEmail = session.user.email
    const user = await prisma.user.findUnique({ where: { email: userEmail || undefined } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    const { seriesId, status, progress } = req.body
    if (!seriesId) return res.status(400).json({ error: 'Missing seriesId' })

    const existing = await prisma.bookmark.findFirst({ where: { userId: user.id, seriesId } })
    if (existing) {
      const updated = await prisma.bookmark.update({ where: { id: existing.id }, data: { status, progress } })
      return res.status(200).json(updated)
    }
    const created = await prisma.bookmark.create({ data: { userId: user.id, seriesId, status: status || 'READING', progress: progress || 0 } })
    return res.status(201).json(created)
  }

  res.status(405).end()
}
