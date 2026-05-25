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

  const approvals = await prisma.pendingApproval.findMany({
    where: { ...where, status: "PENDING" },
    include: { warehouse: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ approvals })
}
