import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { Role } from "@/generated/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { role } = session.user
  if (!["REGIONAL_MANAGER", "CEO"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { action, reviewNote } = await req.json()

  const approval = await prisma.pendingApproval.findUnique({ where: { id } })
  if (!approval) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (action === "approve") {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username: approval.username }, { email: approval.email }] },
    })
    if (existingUser) {
      await prisma.pendingApproval.update({
        where: { id },
        data: { status: "REJECTED", reviewerId: session.user.id, reviewNote: "Username or email already exists" },
      })
      return NextResponse.json({ error: "Username or email already taken" }, { status: 409 })
    }

    await prisma.user.create({
      data: {
        firstName: approval.firstName,
        lastName: approval.lastName,
        username: approval.username,
        email: approval.email,
        password: approval.password,
        role: approval.requestedRole as Role,
        status: "ACTIVE",
        warehouseId: approval.warehouseId,
      },
    })

    await prisma.pendingApproval.update({
      where: { id },
      data: { status: "APPROVED", reviewerId: session.user.id, reviewNote: reviewNote || null },
    })

    return NextResponse.json({ message: "User approved and created" })
  }

  if (action === "reject") {
    await prisma.pendingApproval.update({
      where: { id },
      data: { status: "REJECTED", reviewerId: session.user.id, reviewNote: reviewNote || null },
    })
    return NextResponse.json({ message: "Request rejected" })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
