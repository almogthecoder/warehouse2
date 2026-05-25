import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { ItemType } from "@/generated/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role } = session.user
  if (!["WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { name, type, quantity, section } = await req.json()

  const item = await prisma.item.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(type && { type: type as ItemType }),
      ...(quantity !== undefined && { quantity: Number(quantity) }),
      ...(section !== undefined && { section: section || null }),
    },
  })
  return NextResponse.json({ item })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role } = session.user
  if (!["WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  await prisma.item.delete({ where: { id } })
  return NextResponse.json({ message: "Item deleted" })
}
