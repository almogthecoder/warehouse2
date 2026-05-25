"use client"

import { useState } from "react"
import type { Session } from "next-auth"
import { Sidebar, MenuButton } from "@/components/layout/sidebar"

export function DashboardShell({
  session,
  children,
}: {
  session: Session
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 lg:hidden">
          <MenuButton onClick={() => setSidebarOpen(true)} />
          <span className="text-lg">🦚</span>
          <span className="font-bold text-slate-900">שבט משגב</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
      <Sidebar
        role={session.user.role}
        firstName={session.user.firstName}
        lastName={session.user.lastName}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />
    </div>
  )
}
