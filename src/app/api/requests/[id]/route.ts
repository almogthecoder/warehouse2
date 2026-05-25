import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import type { RequestStatus } from "@/generated/prisma"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { status } = await req.json()
  const { role } = session.user

  const request = await prisma.workerRequest.findUnique({ where: { id } })
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (role === "TEAM_MANAGER" && ["INCLUDED", "REJECTED"].includes(status)) {
    const updated = await prisma.workerRequest.update({
      where: { id },
      data: { status: status as RequestStatus },
    })
    return NextResponse.json({ request: updated })
  }

  if (role === "WORKER" && request.workerId === session.user.id && status === "DRAFT") {
    const updated = await prisma.workerRequest.update({
      where: { id },
      data: { status: "DRAFT" },
    })
    return NextResponse.json({ request: updated })
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const request = await prisma.workerRequest.findUnique({ where: { id } })
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (request.workerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.workerRequest.delete({ where: { id } })
  return NextResponse.json({ message: "Deleted" })
}
