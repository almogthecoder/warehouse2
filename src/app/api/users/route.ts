import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role, warehouseId } = session.user
  if (!["REGIONAL_MANAGER", "CEO"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const where = role === "CEO" ? {} : { warehouseId: warehouseId ?? undefined }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true, firstName: true, lastName: true, username: true,
      email: true, role: true, status: true, warehouseId: true, teamId: true,
      warehouse: { select: { name: true } },
      team: { select: { id: true, name: true } },
      managedTeam: { select: { id: true, name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ users })
}
