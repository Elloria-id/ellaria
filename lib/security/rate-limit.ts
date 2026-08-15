import { NextResponse } from 'next/server'

interface RateLimitConfig {
  max: number
  window: number // in seconds
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  ip: string,
  config: RateLimitConfig = { max: 10, window: 60 }
) {
  const now = Date.now()
  const key = ip
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.window * 1000,
    })
    return { allowed: true }
  }

  if (entry.count >= config.max) {
    return {
      allowed: false,
      resetAt: entry.resetAt,
    }
  }

  entry.count++
  return { allowed: true }
}

export function withRateLimit(handler: Function, config?: RateLimitConfig) {
  return async (req: Request, ...args: any[]) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const result = rateLimit(ip, config)

    if (!result.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Reset': String(result.resetAt),
          },
        }
      )
    }

    return handler(req, ...args)
  }
}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)
