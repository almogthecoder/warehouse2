"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, ClipboardList, Users, ShieldBan, CheckCircle, ScrollText } from "lucide-react"
import { ROLE_LABELS } from "@/lib/utils"
import Link from "next/link"

interface Stats {
  pendingRequests?: number
  pendingOrders?: number
  totalItems?: number
  teams?: number
  pendingApprovals?: number
  blacklistedTeams?: number
}

export function DashboardClient({ role, firstName }: { role: string; firstName: string }) {
  const [stats, setStats] = useState<Stats>({})

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {})
  }, [])

  const cards = [
    role === "WORKER" && {
      href: "/requests",
      icon: ClipboardList,
      label: "הבקשות שלי",
      value: stats.pendingRequests ?? 0,
      sublabel: "ממתינות",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    role === "TEAM_MANAGER" && {
      href: "/team-requests",
      icon: ClipboardList,
      label: "בקשות הצוות",
      value: stats.pendingRequests ?? 0,
      sublabel: "ממתינות",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    ["WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role) && {
      href: "/orders",
      icon: ScrollText,
      label: "הזמנות ציוד",
      value: stats.pendingOrders ?? 0,
      sublabel: "ממתינות",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    ["WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role) && {
      href: "/inventory",
      icon: Package,
      label: "פריטי מלאי",
      value: stats.totalItems ?? 0,
      sublabel: "סה״כ",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    ["WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role) && {
      href: "/teams",
      icon: Users,
      label: "צוותים",
      value: stats.teams ?? 0,
      sublabel: "רשומים",
      color: "text-green-600",
      bg: "bg-green-50",
    },
    ["WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role) && {
      href: "/blacklist",
      icon: ShieldBan,
      label: "ברשימה שחורה",
      value: stats.blacklistedTeams ?? 0,
      sublabel: "צוותים",
      color: "text-red-600",
      bg: "bg-red-50",
    },
    ["REGIONAL_MANAGER", "CEO"].includes(role) && {
      href: "/approvals",
      icon: CheckCircle,
      label: "אישורים ממתינים",
      value: stats.pendingApprovals ?? 0,
      sublabel: "בקשות",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ].filter(Boolean) as Array<{
    href: string; icon: React.ElementType; label: string; value: number
    sublabel: string; color: string; bg: string
  }>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          שלום, {firstName}! 👋
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="default">{ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="text-slate-700 font-medium">{card.label}</span>{" "}
                    {card.sublabel}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
