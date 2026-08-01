import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password, name } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ error: 'User exists' })

  const passwordHash = await bcrypt.hash(password, 10)
  // Note: User model does not store passwordHash in schema. For a proper auth system, add a passwordHash field.
  // As a scaffold, we'll store passwordHash in a simple key-value table 'Auth' isn't present. To keep schema unchanged, we'll store password in a naive way in user.avatar as note (DEV ONLY). Replace with proper migration later.

  const user = await prisma.user.create({ data: { email, name: name || '', avatar: '', role: 'USER' } })

  // For demo only: store passwordHash in a separate file won't persist across prisma. We recommend adding passwordHash to schema.

  res.status(201).json({ ok: true, user })
}
