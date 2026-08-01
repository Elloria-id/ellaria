import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null

        // In this scaffold we expect a passwordHash column, but schema doesn't have it.
        // For dev, accept password 'password123' for any seeded user email admin@ellaria.test
        if (credentials.password === 'password123' && user.email === 'admin@ellaria.test') {
          return { id: user.id, email: user.email, name: user.name, role: user.role }
        }

        // For production, implement secure password checks (store password hashes in DB)
        return null
      },
    }),
    // Google provider placeholders - set env vars to enable
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // attach role if available
        // @ts-ignore
        token.role = (user as any).role || 'USER'
      }
      return token
    },
    async session({ session, token }) {
      // @ts-ignore
      session.user = session.user || {}
      // @ts-ignore
      session.user.role = (token as any).role || 'USER'
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}

export default NextAuth(authOptions)
