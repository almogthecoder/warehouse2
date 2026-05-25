import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
        })

        if (!user || user.status !== "ACTIVE") return null

        const valid = await bcrypt.compare(credentials.password as string, user.password)
        if (!valid) return null

        return {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
          warehouseId: user.warehouseId,
          teamId: user.teamId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as Record<string, unknown>
        token.id = u.id as string
        token.username = u.username as string
        token.firstName = u.firstName as string
        token.lastName = u.lastName as string
        token.role = u.role as string
        token.status = u.status as string
        token.warehouseId = u.warehouseId as string | null
        token.teamId = u.teamId as string | null
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id as string
      session.user.username = token.username as string
      session.user.firstName = token.firstName as string
      session.user.lastName = token.lastName as string
      session.user.role = token.role as string
      session.user.status = token.status as string
      session.user.warehouseId = token.warehouseId as string | null
      session.user.teamId = token.teamId as string | null
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
