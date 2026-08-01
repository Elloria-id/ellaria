// Basic API route - list chapters for a series (mock)
import type { NextApiRequest, NextApiResponse } from 'next'

type Chapter = {
  id: string
  title: string
  number: number
}

export default function handler(req: NextApiRequest, res: NextApiResponse<Chapter[]>) {
  const data: Chapter[] = [
    { id: 'c1', title: 'Chapter 1', number: 1 },
    { id: 'c2', title: 'Chapter 2', number: 2 },
  ]
  res.status(200).json(data)
}
