import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const isPublic = searchParams.get("public") === "true"

  if (isPublic) {
    const warehouses = await prisma.warehouse.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })
    return NextResponse.json({ warehouses })
  }

  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "CEO") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const warehouses = await prisma.warehouse.findMany({
    include: { _count: { select: { users: true, teams: true } } },
    orderBy: { name: "asc" },
  })
  return NextResponse.json({ warehouses })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "CEO") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { name, address } = await req.json()
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  const warehouse = await prisma.warehouse.create({ data: { name, address } })
  return NextResponse.json({ warehouse }, { status: 201 })
}
