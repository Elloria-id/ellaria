// Basic API route - list series (mock)
import type { NextApiRequest, NextApiResponse } from 'next'

type Series = {
  id: string
  title: string
  slug: string
  coverUrl?: string
}

export default function handler(req: NextApiRequest, res: NextApiResponse<Series[]>) {
  const data: Series[] = [
    { id: 's1', title: 'Sample Series 1', slug: 'sample-series-1', coverUrl: '/placeholder.png' },
    { id: 's2', title: 'Sample Series 2', slug: 'sample-series-2', coverUrl: '/placeholder.png' },
  ]
  res.status(200).json(data)
}
