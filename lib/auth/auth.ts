import { PrismaAdapter } from '@auth/prisma-adapter'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    CredentialsProvider({
      name: 'Credentials',

      credentials: {
        email: {
          label: 'Email',
          type: 'email',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email.toLowerCase().trim()

        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        })

        if (!user) {
          return null
        }

        if (user.isBanned) {
          throw new Error('ACCOUNT_BANNED')
        }

        if (!user.passwordHash) {
          return null
        }

        const validPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!validPassword) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
          coins: user.coins,
          exp: user.exp,
          level: user.level,
          isBanned: user.isBanned,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.avatar = user.avatar
        token.coins = user.coins
        token.exp = user.exp
        token.level = user.level
        token.isBanned = user.isBanned
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.username as string
        session.user.username = token.username as string
        session.user.role = token.role as string
        session.user.avatar = token.avatar as string | null
        session.user.coins = token.coins as number
        session.user.exp = token.exp as number
        session.user.level = token.level as number
        session.user.isBanned = token.isBanned as boolean
      }

      return session
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
}
