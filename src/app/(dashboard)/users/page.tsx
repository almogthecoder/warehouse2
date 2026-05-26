"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Users, Pencil, Trash2 } from "lucide-react"
import { ROLE_LABELS } from "@/lib/utils"

interface Team { id: string; name: string; type: string }
interface User {
  id: string; firstName: string; lastName: string; username: string; email: string
  role: string; status: string; createdAt: string; warehouseId?: string; teamId?: string
  warehouse?: { name: string }
  team?: { id: string; name: string }
  managedTeam?: { id: string; name: string }
}

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "outline"> = {
  ACTIVE: "success", PENDING: "warning", SUSPENDED: "destructive",
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({ status: "", userRole: "", teamId: "", managedTeamId: "" })
  const [teams, setTeams] = useState<Team[]>([])
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  function load() {
    fetch("/api/users").then((r) => r.json()).then((d) => setUsers(d.users ?? []))
  }

  useEffect(() => { load() }, [])

  function openEdit(user: User) {
    setEditUser(user)
    setForm({
      status: user.status,
      userRole: user.role,
      teamId: user.teamId ?? "",
      managedTeamId: user.managedTeam?.id ?? "",
    })
    setEditOpen(true)

    if (user.warehouseId) {
      fetch(`/api/teams?public=true&warehouseId=${user.warehouseId}`)
        .then((r) => r.json())
        .then((d) => setTeams(d.teams ?? []))
        .catch(() => setTeams([]))
    }
  }

  async function saveEdit() {
    if (!editUser) return
    setLoading(true)

    const body: Record<string, unknown> = { status: form.status, userRole: form.userRole }

    if (form.userRole === "WORKER") {
      body.teamId = form.teamId || null
    } else if (form.userRole === "TEAM_MANAGER") {
      body.managedTeamId = form.managedTeamId || null
      // Clear worker team membership if they were previously a worker
      if (editUser.role === "WORKER") body.teamId = null
    } else {
      // Non-worker, non-manager: clear team assignments
      if (editUser.role === "WORKER") body.teamId = null
      if (editUser.role === "TEAM_MANAGER") body.managedTeamId = null
    }

    await fetch(`/api/users/${editUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setLoading(false); setEditOpen(false); load()
  }

  async function removeUser() {
    if (!deleteUser) return
    setLoading(true)
    await fetch(`/api/users/${deleteUser.id}`, { method: "DELETE" })
    setLoading(false); setDeleteUser(null); load()
  }

  const filtered = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.username} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const editIsWorker = form.userRole === "WORKER"
  const editIsTeamManager = form.userRole === "TEAM_MANAGER"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">משתמשים</h1>
        <Input
          placeholder="חיפוש משתמשים..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            לא נמצאו משתמשים.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{user.firstName} {user.lastName}</p>
                      <Badge variant={STATUS_COLORS[user.status] ?? "outline"}>{user.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">@{user.username} · {user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="default" className="text-xs">
                        {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role}
                      </Badge>
                      {user.warehouse && <span className="text-xs text-slate-400">{user.warehouse.name}</span>}
                      {user.team && <span className="text-xs text-slate-400">· {user.team.name}</span>}
                      {user.managedTeam && <span className="text-xs text-slate-400">· מנהל: {user.managedTeam.name}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteUser(user)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title={`Edit: ${editUser?.firstName} ${editUser?.lastName}`}>
        <div className="space-y-3">
          <Select label="סטטוס" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="ACTIVE">פעיל</option>
            <option value="SUSPENDED">מושעה</option>
          </Select>
          <Select
            label="תפקיד"
            value={form.userRole}
            onChange={(e) => setForm((f) => ({ ...f, userRole: e.target.value, teamId: "", managedTeamId: "" }))}
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>

          {editIsWorker && (
            <Select
              label="צוות"
              value={form.teamId}
              onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
            >
              <option value="">ללא צוות</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.type === "SPECIAL" ? " ★" : ""}
                </option>
              ))}
            </Select>
          )}

          {editIsTeamManager && (
            <Select
              label="צוות בניהול"
              value={form.managedTeamId}
              onChange={(e) => setForm((f) => ({ ...f, managedTeamId: e.target.value }))}
            >
              <option value="">ללא צוות</option>
              {teams.filter((t) => t.type === "REGULAR").map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1">ביטול</Button>
            <Button onClick={saveEdit} loading={loading} className="flex-1">שמור שינויים</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!deleteUser} onClose={() => setDeleteUser(null)} title="מחיקת משתמש">
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            האם למחוק את המשתמש{" "}
            <span className="font-semibold text-slate-900">
              {deleteUser?.firstName} {deleteUser?.lastName}
            </span>
            ? פעולה זו אינה הפיכה.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteUser(null)} className="flex-1">ביטול</Button>
            <Button variant="destructive" onClick={removeUser} loading={loading} className="flex-1">מחק</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
