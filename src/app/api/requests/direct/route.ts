import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// Returns PENDING requests from SPECIAL teams — visible directly to warehouse staff
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role, warehouseId } = session.user
  if (!["WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const requests = await prisma.workerRequest.findMany({
    where: {
      warehouseId: warehouseId ?? undefined,
      status: "PENDING",
      team: { type: "SPECIAL" },
    },
    include: {
      items: { include: { item: true } },
      worker: { select: { firstName: true, lastName: true } },
      team: { select: { id: true, name: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ requests })
}
