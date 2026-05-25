import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role, warehouseId, id, teamId } = session.user
  const stats: Record<string, number> = {}

  try {
    if (role === "WORKER") {
      stats.pendingRequests = await prisma.workerRequest.count({
        where: { workerId: id, status: "PENDING" },
      })
    }

    if (role === "TEAM_MANAGER") {
      stats.pendingRequests = await prisma.workerRequest.count({
        where: { teamId: teamId ?? undefined, status: "PENDING" },
      })
    }

    if (["WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role)) {
      stats.pendingOrders = await prisma.supplyOrder.count({
        where: { warehouseId: warehouseId ?? undefined, status: "PENDING" },
      })
      stats.totalItems = await prisma.item.count({
        where: { warehouseId: warehouseId ?? undefined },
      })
      stats.teams = await prisma.team.count({
        where: { warehouseId: warehouseId ?? undefined },
      })
      stats.blacklistedTeams = await prisma.team.count({
        where: { warehouseId: warehouseId ?? undefined, isBlacklisted: true },
      })
    }

    if (["REGIONAL_MANAGER", "CEO"].includes(role)) {
      stats.pendingApprovals = await prisma.pendingApproval.count({
        where: {
          status: "PENDING",
          ...(role === "REGIONAL_MANAGER" && { warehouseId: warehouseId ?? undefined }),
        },
      })
    }
  } catch (e) {
    console.error(e)
  }

  return NextResponse.json(stats)
}
