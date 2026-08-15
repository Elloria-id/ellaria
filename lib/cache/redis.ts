import Redis from 'ioredis'

let redis: Redis | null = null

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL)
}

export class CacheService {
  static async get(key: string): Promise<string | null> {
    if (!redis) return null
    try {
      return await redis.get(key)
    } catch {
      return null
    }
  }

  static async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!redis) return
    try {
      if (ttl) {
        await redis.setex(key, ttl, value)
      } else {
        await redis.set(key, value)
      }
    } catch {
      // Ignore cache errors
    }
  }

  static async delete(key: string): Promise<void> {
    if (!redis) return
    try {
      await redis.del(key)
    } catch {
      // Ignore cache errors
    }
  }

  static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get(key)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        // If parsing fails, ignore cache
      }
    }

    const data = await fetchFn()
    try {
      await this.set(key, JSON.stringify(data), ttl)
    } catch {
      // Ignore cache errors
    }

    return data
  }
}
