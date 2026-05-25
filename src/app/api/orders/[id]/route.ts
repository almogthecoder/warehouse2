import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const order = await prisma.supplyOrder.findUnique({
    where: { id },
    include: {
      items: { include: { item: true } },
      team: { select: { name: true, isBlacklisted: true } },
      manager: { select: { firstName: true, lastName: true } },
      fulfilledBy: { select: { firstName: true, lastName: true } },
      workerRequests: {
        include: {
          worker: { select: { firstName: true, lastName: true } },
          items: { include: { item: true } },
        },
      },
      returnLogs: { include: { item: true, recordedBy: { select: { firstName: true, lastName: true } } } },
    },
  })

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ order })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role } = session.user
  if (!["WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { action, returnItems, flagTeam } = await req.json()

  if (action === "fulfill") {
    const order = await prisma.supplyOrder.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (order.status !== "PENDING") return NextResponse.json({ error: "Order already processed" }, { status: 400 })

    // Deduct items from inventory (both BURNABLE and REUSABLE leave the shelf when handed out)
    for (const oi of order.items) {
      await prisma.item.update({
        where: { id: oi.itemId },
        data: { quantity: { decrement: oi.quantity } },
      })
    }

    const updated = await prisma.supplyOrder.update({
      where: { id },
      data: {
        status: "FULFILLED",
        fulfilledAt: new Date(),
        fulfilledById: session.user.id,
      },
    })
    return NextResponse.json({ order: updated })
  }

  if (action === "return" && returnItems) {
    const order = await prisma.supplyOrder.findUnique({
      where: { id },
      include: { items: { include: { item: true } } },
    })
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

    for (const ri of returnItems as { itemId: string; quantity: number }[]) {
      await prisma.returnLog.create({
        data: {
          orderId: id,
          itemId: ri.itemId,
          quantity: ri.quantity,
          recordedById: session.user.id,
        },
      })
      await prisma.orderItem.updateMany({
        where: { orderId: id, itemId: ri.itemId },
        data: { returned: { increment: ri.quantity } },
      })
      // Restore REUSABLE items back to inventory; BURNABLE items are consumed permanently
      const item = await prisma.item.findUnique({ where: { id: ri.itemId }, select: { type: true } })
      if (item?.type === "REUSABLE") {
        await prisma.item.update({
          where: { id: ri.itemId },
          data: { quantity: { increment: ri.quantity } },
        })
      }
    }

    const updatedOrder = await prisma.supplyOrder.findUnique({
      where: { id },
      include: { items: true },
    })
    const allReturned = updatedOrder!.items.every((oi) => oi.returned >= oi.quantity)

    if (allReturned) {
      await prisma.supplyOrder.update({ where: { id }, data: { status: "COMPLETED" } })
    }

    return NextResponse.json({ message: "Return logged" })
  }

  if (action === "flag") {
    await prisma.supplyOrder.update({ where: { id }, data: { status: "FLAGGED" } })
    if (flagTeam) {
      const order = await prisma.supplyOrder.findUnique({ where: { id } })
      if (order && ["WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role)) {
        await prisma.team.update({
          where: { id: order.teamId },
          data: { isBlacklisted: true, blacklistReason: "Did not return reusable items" },
        })
      }
    }
    return NextResponse.json({ message: "Order flagged" })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
