"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { encode } from "next-auth/jwt"
import { cookies } from "next/headers"

const COOKIE_NAME = "authjs.session-token"
const MAX_AGE = 30 * 24 * 60 * 60 // 30 days

export async function loginAction(username: string, password: string): Promise<string | null> {
  if (!username || !password) return "Please enter username and password"

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user || user.status !== "ACTIVE") return "Invalid username or password"

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return "Invalid username or password"

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error("NEXTAUTH_SECRET not set")

  // For Team Managers, teamId comes from the team they manage (Team.managerId),
  // not from User.teamId (which is the team they're a member of as a worker).
  let effectiveTeamId = user.teamId
  if (user.role === "TEAM_MANAGER") {
    const managedTeam = await prisma.team.findFirst({
      where: { managerId: user.id },
      select: { id: true },
    })
    effectiveTeamId = managedTeam?.id ?? null
  }

  const token = await encode({
    token: {
      sub: user.id,
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email ?? undefined,
      role: user.role,
      status: user.status,
      warehouseId: user.warehouseId,
      teamId: effectiveTeamId,
    },
    secret,
    salt: COOKIE_NAME,
    maxAge: MAX_AGE,
  })

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  })

  return null
}
