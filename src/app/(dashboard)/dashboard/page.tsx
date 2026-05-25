import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const { role, firstName } = session.user
  return <DashboardClient role={role} firstName={firstName} />
}
