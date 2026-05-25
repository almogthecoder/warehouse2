import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role } = session.user
  if (!["WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { name, type, isBlacklisted, blacklistReason, managerId } = await req.json()

  const team = await prisma.team.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(type && { type: type === "SPECIAL" ? "SPECIAL" : "REGULAR" }),
      ...(isBlacklisted !== undefined && { isBlacklisted }),
      ...(blacklistReason !== undefined && { blacklistReason: blacklistReason || null }),
      ...(managerId !== undefined && { managerId: managerId || null }),
    },
  })
  return NextResponse.json({ team })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role } = session.user
  if (!["WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  await prisma.team.delete({ where: { id } })
  return NextResponse.json({ message: "Team deleted" })
}
