import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { encode } from "next-auth/jwt"

const COOKIE_NAME = "authjs.session-token"
const MAX_AGE = 30 * 24 * 60 * 60

export async function POST(req: Request) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: "Please enter username and password" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
  }

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
  }

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

  const response = NextResponse.json({ success: true })
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  })

  return response
}
