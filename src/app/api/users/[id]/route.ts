import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { Role, UserStatus } from "@/generated/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role } = session.user
  if (!["REGIONAL_MANAGER", "CEO"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { status, userRole, teamId, warehouseId, managedTeamId } = await req.json()

  const updateData: { status?: UserStatus; role?: Role; teamId?: string | null; warehouseId?: string | null } = {}
  if (status) updateData.status = status as UserStatus
  if (userRole) updateData.role = userRole as Role
  if (teamId !== undefined) updateData.teamId = teamId
  if (warehouseId !== undefined) updateData.warehouseId = warehouseId

  // Handle Team Manager assignment: update Team.managerId instead of User.teamId
  if (managedTeamId !== undefined) {
    // Remove this user as manager from any team they currently manage
    await prisma.team.updateMany({ where: { managerId: id }, data: { managerId: null } })
    // Assign them to the new team (if not unassigning)
    if (managedTeamId) {
      await prisma.team.update({ where: { id: managedTeamId }, data: { managerId: id } })
    }
  }

  const user = await prisma.user.update({ where: { id }, data: updateData })
  return NextResponse.json({ user })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const isSelf = session.user.id === id
  const isAdmin = ["REGIONAL_MANAGER", "CEO"].includes(session.user.role)

  if (!isSelf && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ message: "User deleted" })
}
