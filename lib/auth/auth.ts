import { PrismaAdapter } from '@auth/prisma-adapter'
import type { NextAuthOptions } from 'next-auth'
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
      name: 'credentials',

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
          throw new Error('Email dan password diperlukan')
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email.toLowerCase().trim(),
          },
        })

        if (!user) {
          throw new Error('Email atau password salah')
        }

        if (user.isBanned) {
          throw new Error('Akun Anda telah diblokir')
        }

        if (!user.passwordHash) {
          throw new Error('Akun belum memiliki password')
        }

        const validPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!validPassword) {
          throw new Error('Email atau password salah')
        }

        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            lastActiveAt: new Date(),
          },
        })

        return {
          id: user.id,
          email: user.email,
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
        // user is the object returned from authorize; these properties are expected per module augmentation
        if ('id' in user) token.id = user.id
        if ('username' in user) token.username = user.username
        if ('role' in user) token.role = user.role
        if ('avatar' in user) token.avatar = user.avatar
        if ('coins' in user) token.coins = user.coins
        if ('exp' in user) token.exp = user.exp
        if ('level' in user) token.level = user.level
        if ('isBanned' in user) token.isBanned = user.isBanned
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as import('@prisma/client').Role
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
}
