"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Package, ClipboardList, Users, Building2,
  ShieldBan, CheckCircle, Warehouse, LogOut, Menu, X, ScrollText,
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles: string[]
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",     label: "לוח בקרה",       icon: LayoutDashboard, roles: ["WORKER", "TEAM_MANAGER", "WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"] },
  { href: "/requests",      label: "הבקשות שלי",     icon: ClipboardList,   roles: ["WORKER"] },
  { href: "/team-requests", label: "בקשות הצוות",     icon: ClipboardList,   roles: ["TEAM_MANAGER"] },
  { href: "/orders",        label: "הזמנות ציוד",    icon: ScrollText,      roles: ["WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER"] },
  { href: "/inventory",     label: "מלאי",            icon: Package,         roles: ["WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER"] },
  { href: "/teams",         label: "צוותים",           icon: Users,           roles: ["TEAM_MANAGER", "WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER"] },
  { href: "/blacklist",     label: "רשימה שחורה",    icon: ShieldBan,       roles: ["WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER"] },
  { href: "/users",         label: "משתמשים",         icon: Users,           roles: ["REGIONAL_MANAGER", "CEO"] },
  { href: "/approvals",     label: "אישורים",         icon: CheckCircle,     roles: ["REGIONAL_MANAGER", "CEO"] },
  { href: "/warehouses",    label: "מחסנים",          icon: Warehouse,       roles: ["CEO"] },
]

const ROLE_LABELS_HE: Record<string, string> = {
  WORKER: "מדריך",
  TEAM_MANAGER: "ראש גדוד/ראש צוות",
  WAREHOUSE_WORKER: "איש מחסן",
  WAREHOUSE_MANAGER: "מנהל מחסן",
  REGIONAL_MANAGER: "מרכז",
  CEO: "הנהגה",
}

interface SidebarProps {
  role: string
  firstName: string
  lastName: string
  open: boolean
  setOpen: (v: boolean) => void
}

export function Sidebar({ role, firstName, lastName, open, setOpen }: SidebarProps) {
  const pathname = usePathname()
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-64 z-30 flex flex-col transition-transform duration-200",
          "bg-gradient-to-b from-blue-900 via-blue-800 to-purple-900",
          "text-white",
          "lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none">🦚</span>
            <div>
              <p className="font-bold text-base leading-tight tracking-tight">שבט משגב</p>
              <p className="text-xs text-blue-200 leading-tight">ניהול מחסן</p>
            </div>
          </div>
          <button className="lg:hidden text-white/70 hover:text-white" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User info + sign out */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-semibold text-white">{firstName} {lastName}</p>
            <p className="text-xs text-blue-200">{ROLE_LABELS_HE[role] ?? role}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            יציאה
          </button>
        </div>
      </aside>
    </>
  )
}

export function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
    >
      <Menu className="w-5 h-5" />
    </button>
  )
}
