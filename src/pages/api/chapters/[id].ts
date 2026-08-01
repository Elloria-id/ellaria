import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (!id || Array.isArray(id)) return res.status(400).end()

  const chapter = await prisma.chapter.findUnique({ where: { id } })
  if (!chapter) return res.status(404).json({ error: 'Not found' })

  // find next and previous chapters in same series
  const prev = await prisma.chapter.findFirst({ where: { seriesId: chapter.seriesId, number: { lt: chapter.number } }, orderBy: { number: 'desc' } })
  const next = await prisma.chapter.findFirst({ where: { seriesId: chapter.seriesId, number: { gt: chapter.number } }, orderBy: { number: 'asc' } })

  return res.status(200).json({ chapter, prevId: prev?.id || null, nextId: next?.id || null })
}
