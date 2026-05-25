import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { ItemType } from "@/generated/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { warehouseId, role } = session.user
  if (!warehouseId) return NextResponse.json({ items: [] })

  const canEdit = ["WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role)

  const items = await prisma.item.findMany({
    where: { warehouseId },
    orderBy: [{ section: "asc" }, { name: "asc" }],
  })

  return NextResponse.json({ items, canEdit })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role, warehouseId } = session.user
  if (!["WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { name, type, quantity, section } = await req.json()
  if (!name || !type) return NextResponse.json({ error: "Name and type required" }, { status: 400 })

  const item = await prisma.item.create({
    data: {
      name,
      type: type as ItemType,
      quantity: quantity ?? 0,
      section: section || null,
      warehouseId: warehouseId!,
    },
  })
  return NextResponse.json({ item }, { status: 201 })
}
