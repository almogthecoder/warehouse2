import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, role, teamId, warehouseId } = session.user

  if (role === "WORKER") {
    const requests = await prisma.workerRequest.findMany({
      where: { workerId: id },
      include: {
        items: { include: { item: true } },
        worker: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ requests })
  }

  if (role === "TEAM_MANAGER") {
    // Only show requests from REGULAR teams — SPECIAL team requests bypass Team Manager
    const requests = await prisma.workerRequest.findMany({
      where: {
        teamId: teamId ?? undefined,
        status: { in: ["PENDING", "DRAFT"] },
        team: { type: "REGULAR" },
      },
      include: {
        items: { include: { item: true } },
        worker: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ requests })
  }

  return NextResponse.json({ requests: [] })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, role, teamId, warehouseId } = session.user
  if (!["WORKER", "TEAM_MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (!teamId) return NextResponse.json({ error: "You must be in a team" }, { status: 400 })

  const team = await prisma.team.findUnique({ where: { id: teamId } })
  if (team?.isBlacklisted) {
    return NextResponse.json({ error: "Your team is blacklisted from making requests" }, { status: 403 })
  }

  const { items, notes } = await req.json()
  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "At least one item required" }, { status: 400 })
  }

  const request = await prisma.workerRequest.create({
    data: {
      workerId: id,
      teamId,
      warehouseId: warehouseId!,
      notes: notes || null,
      status: "PENDING",
      items: {
        create: items.map((item: { itemId: string; quantity: number }) => ({
          itemId: item.itemId,
          quantity: item.quantity,
        })),
      },
    },
    include: { items: { include: { item: true } } },
  })

  return NextResponse.json({ request }, { status: 201 })
}
