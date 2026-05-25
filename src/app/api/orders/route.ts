import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role, warehouseId, teamId, id } = session.user

  if (role === "TEAM_MANAGER") {
    const orders = await prisma.supplyOrder.findMany({
      where: { managerId: id },
      include: {
        items: { include: { item: true } },
        team: { select: { name: true } },
        workerRequests: {
          include: {
            worker: { select: { firstName: true, lastName: true } },
            items: { include: { item: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ orders })
  }

  if (["WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role)) {
    const orders = await prisma.supplyOrder.findMany({
      where: { warehouseId: warehouseId ?? undefined },
      include: {
        items: { include: { item: true } },
        team: { select: { name: true, isBlacklisted: true } },
        manager: { select: { firstName: true, lastName: true } },
        returnLogs: { include: { item: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ orders })
  }

  return NextResponse.json({ orders: [] })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, role, teamId, warehouseId } = session.user
  if (!["TEAM_MANAGER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (!teamId && role === "TEAM_MANAGER") {
    return NextResponse.json({ error: "You must be in a team" }, { status: 400 })
  }

  if (teamId) {
    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (team?.isBlacklisted) {
      return NextResponse.json({ error: "Your team is blacklisted" }, { status: 403 })
    }
  }

  const { items, notes, requestIds, orderTeamId } = await req.json()
  const resolvedTeamId = orderTeamId || teamId

  if (!resolvedTeamId) {
    return NextResponse.json({ error: "Team is required" }, { status: 400 })
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "At least one item required" }, { status: 400 })
  }

  const order = await prisma.supplyOrder.create({
    data: {
      managerId: id,
      teamId: resolvedTeamId,
      warehouseId: warehouseId!,
      notes: notes || null,
      items: {
        create: items.map((item: { itemId: string; quantity: number }) => ({
          itemId: item.itemId,
          quantity: item.quantity,
        })),
      },
      ...(requestIds && requestIds.length > 0 && {
        workerRequests: { connect: requestIds.map((rid: string) => ({ id: rid })) },
      }),
    },
    include: { items: { include: { item: true } } },
  })

  if (requestIds && requestIds.length > 0) {
    await prisma.workerRequest.updateMany({
      where: { id: { in: requestIds } },
      data: { status: "INCLUDED", orderId: order.id },
    })
  }

  return NextResponse.json({ order }, { status: 201 })
}
