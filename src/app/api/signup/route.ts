import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import type { Role } from "@/generated/prisma"

const MANAGER_ROLES: Role[] = ["TEAM_MANAGER", "WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER"]

export async function POST(req: Request) {
  try {
    const { firstName, lastName, username, email, password, role, warehouseId, teamId } = await req.json()

    if (!firstName || !lastName || !username || !email || !password || !warehouseId) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } })
    if (!warehouse) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 400 })
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    })
    if (existingUser) {
      return NextResponse.json({ error: "Username or email already taken" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const requestedRole: Role = role ?? "WORKER"

    if (requestedRole === "CEO") {
      return NextResponse.json({ error: "Cannot sign up as CEO" }, { status: 400 })
    }

    if (requestedRole === "WORKER") {
      // Validate teamId belongs to this warehouse if provided
      if (teamId) {
        const team = await prisma.team.findFirst({ where: { id: teamId, warehouseId } })
        if (!team) {
          return NextResponse.json({ error: "Invalid team selected" }, { status: 400 })
        }
      }

      await prisma.user.create({
        data: {
          firstName,
          lastName,
          username,
          email,
          password: hashedPassword,
          role: "WORKER",
          status: "ACTIVE",
          warehouseId,
          teamId: teamId || null,
        },
      })
      return NextResponse.json({ message: "Account created" }, { status: 201 })
    }

    if (MANAGER_ROLES.includes(requestedRole)) {
      const existingApproval = await prisma.pendingApproval.findFirst({
        where: { username, status: "PENDING" },
      })
      if (existingApproval) {
        return NextResponse.json({ error: "A request for this username is already pending" }, { status: 409 })
      }

      await prisma.pendingApproval.create({
        data: {
          firstName,
          lastName,
          username,
          email,
          password: hashedPassword,
          requestedRole,
          warehouseId,
        },
      })
      return NextResponse.json({ message: "Approval request submitted" }, { status: 201 })
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
