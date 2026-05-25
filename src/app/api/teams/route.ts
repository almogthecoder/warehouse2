import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const isPublic = searchParams.get("public") === "true"
  const warehouseIdParam = searchParams.get("warehouseId")

  if (isPublic && warehouseIdParam) {
    const teams = await prisma.team.findMany({
      where: { warehouseId: warehouseIdParam, isBlacklisted: false },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    })
    return NextResponse.json({ teams })
  }

  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { warehouseId, role, teamId } = session.user

  if (role === "WORKER" || role === "TEAM_MANAGER") {
    if (!teamId) return NextResponse.json({ teams: [] })
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: { select: { id: true, firstName: true, lastName: true, role: true, status: true } }, manager: { select: { firstName: true, lastName: true } } },
    })
    return NextResponse.json({ teams: team ? [team] : [] })
  }

  const teams = await prisma.team.findMany({
    where: { warehouseId: warehouseId ?? undefined },
    include: {
      _count: { select: { members: true } },
      manager: { select: { firstName: true, lastName: true } },
    },
    orderBy: { name: "asc" },
  })
  return NextResponse.json({ teams })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role, warehouseId } = session.user
  if (!["WAREHOUSE_MANAGER", "REGIONAL_MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (!warehouseId) {
    return NextResponse.json({ error: "Your account is not assigned to a warehouse" }, { status: 400 })
  }

  const { name, type } = await req.json()
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })

  const team = await prisma.team.create({
    data: { name, type: type === "SPECIAL" ? "SPECIAL" : "REGULAR", warehouseId: warehouseId! },
  })
  return NextResponse.json({ team }, { status: 201 })
}
