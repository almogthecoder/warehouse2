import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { encode } from "next-auth/jwt"

const MAX_AGE = 30 * 24 * 60 * 60

// Replicate NextAuth's exact cookie-name logic from @auth/core/lib/init.js:
// 1. If AUTH_URL or NEXTAUTH_URL is set, use its protocol.
// 2. Otherwise fall back to the x-forwarded-proto request header.
function getSessionCookieName(req: Request): { name: string; secure: boolean } {
  const envUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL
  let useSecureCookies: boolean
  if (envUrl) {
    useSecureCookies = new URL(envUrl).protocol === "https:"
  } else {
    const proto = req.headers.get("x-forwarded-proto") ?? ""
    useSecureCookies = proto.startsWith("https")
  }
  return {
    name: `${useSecureCookies ? "__Secure-" : ""}authjs.session-token`,
    secure: useSecureCookies,
  }
}

export async function POST(req: Request) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: "נא להזין שם משתמש וסיסמה" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "שם משתמש או סיסמה שגויים" }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return NextResponse.json({ error: "שם משתמש או סיסמה שגויים" }, { status: 401 })
  }

  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  if (!secret) {
    return NextResponse.json({ error: "תצורת שרת שגויה" }, { status: 500 })
  }

  let effectiveTeamId = user.teamId
  if (user.role === "TEAM_MANAGER") {
    const managedTeam = await prisma.team.findFirst({
      where: { managerId: user.id },
      select: { id: true },
    })
    effectiveTeamId = managedTeam?.id ?? null
  }

  const { name: cookieName, secure } = getSessionCookieName(req)

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
    salt: cookieName,
    maxAge: MAX_AGE,
  })

  const response = NextResponse.json({ success: true })
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  })

  return response
}
