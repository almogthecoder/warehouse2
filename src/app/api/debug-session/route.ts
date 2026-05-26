import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { cookies, headers } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const headerStore = await headers()

  const allCookies = cookieStore.getAll().map((c) => ({
    name: c.name,
    valueLength: c.value.length,
    valuePreview: c.value.slice(0, 20) + "...",
  }))

  const proto = headerStore.get("x-forwarded-proto")
  const host = headerStore.get("host")
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? null
  const hasSecret = !!(process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET)

  let session = null
  let sessionError = null
  try {
    session = await auth()
  } catch (e: unknown) {
    sessionError = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json({
    cookies: allCookies,
    proto,
    host,
    authUrl,
    hasSecret,
    nodeEnv: process.env.NODE_ENV,
    session: session
      ? { userId: session.user?.id, role: session.user?.role }
      : null,
    sessionError,
  })
}
