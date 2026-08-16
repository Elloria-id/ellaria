declare module 'next-auth' {
  interface Session {
    user: User
  }

  interface User {
    id: string
    username: string
    role: import('@prisma/client').Role
    avatar?: string | null
    coins?: number
    exp?: number
    level?: number
    isBanned?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    role: import('@prisma/client').Role
    avatar?: string | null
    coins?: number
    exp?: number
    level?: number
    isBanned?: boolean
  }
}
