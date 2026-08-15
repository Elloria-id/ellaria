import crypto from 'crypto'

export class CSRFProtection {
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  static verifyToken(token: string, storedToken: string): boolean {
    return token === storedToken
  }

  static middleware(req: Request): boolean {
    // Skip for GET requests
    if (req.method === 'GET') return true

    const csrfToken = req.headers.get('x-csrf-token')
    const storedToken = req.cookies.get('csrf-token')?.value

    if (!csrfToken || !storedToken) {
      return false
    }

    return this.verifyToken(csrfToken, storedToken)
  }
}
