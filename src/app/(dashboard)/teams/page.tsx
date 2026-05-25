"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus, Users, Pencil, Star } from "lucide-react"
import { ROLE_LABELS } from "@/lib/utils"

interface TeamMember { id: string; firstName: string; lastName: string; role: string; status: string }
interface Team {
  id: string
  name: string
  type: "REGULAR" | "SPECIAL"
  isBlacklisted: boolean
  blacklistReason?: string
  manager?: { firstName: string; lastName: string }
  members?: TeamMember[]
  _count?: { members: number }
}

export default function TeamsPage() {
  const { data: session } = useSession()
  const [teams, setTeams] = useState<Team[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [editTeam, setEditTeam] = useState<Team | null>(null)
  const [form, setForm] = useState({ name: "", type: "REGULAR" as "REGULAR" | "SPECIAL" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const role = session?.user?.role ?? ""
  const canManage = ["WAREHOUSE_MANAGER", "REGIONAL_MANAGER"].includes(role)

  function load() {
    fetch("/api/teams").then((r) => r.json()).then((d) => setTeams(d.teams ?? []))
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setForm({ name: "", type: "REGULAR" })
    setCreateOpen(true)
  }

  function openEdit(team: Team) {
    setForm({ name: team.name, type: team.type })
    setEditTeam(team)
  }

  async function saveCreate() {
    if (!form.name.trim()) return
    setError("")
    setLoading(true)
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), type: form.type }),
    })
    setLoading(false)
    if (res.ok) {
      setCreateOpen(false)
      load()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? `Error ${res.status}`)
    }
  }

  async function saveEdit() {
    if (!editTeam || !form.name.trim()) return
    setError("")
    setLoading(true)
    const res = await fetch(`/api/teams/${editTeam.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), type: form.type }),
    })
    setLoading(false)
    if (res.ok) {
      setEditTeam(null)
      load()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? `Error ${res.status}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">צוותים</h1>
        {canManage && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> צוות חדש
          </Button>
        )}
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            אין צוותים עדיין.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className={team.isBlacklisted ? "border-red-200" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{team.name}</p>
                    {team.type === "SPECIAL" && (
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {team.isBlacklisted && <Badge variant="destructive">ברשימה שחורה</Badge>}
                    {canManage && (
                      <button
                        onClick={() => openEdit(team)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={team.type === "SPECIAL" ? "secondary" : "outline"} className="text-xs">
                    {team.type === "SPECIAL" ? "ישיר למחסן" : "רגיל"}
                  </Badge>
                </div>

                {team.manager ? (
                  <p className="text-sm text-slate-600">
                    ראש גדוד/ראש צוות: {team.manager.firstName} {team.manager.lastName}
                  </p>
                ) : team.type === "REGULAR" ? (
                  <p className="text-sm text-slate-400 italic">לא הוקצה ראש גדוד/ראש צוות</p>
                ) : (
                  <p className="text-sm text-slate-500">בקשות עוברות ישירות למחסן</p>
                )}

                <p className="text-sm text-slate-500 mt-1">
                  {team._count?.members ?? team.members?.length ?? 0} חברים
                </p>

                {team.blacklistReason && (
                  <p className="text-xs text-red-600 mt-1">{team.blacklistReason}</p>
                )}

                {team.members && team.members.length > 0 && (
                  <div className="mt-3 space-y-1 border-t pt-2">
                    {team.members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">{m.firstName} {m.lastName}</span>
                        <Badge variant="outline" className="text-xs">
                          {ROLE_LABELS[m.role as keyof typeof ROLE_LABELS] ?? m.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onClose={() => { setCreateOpen(false); setError("") }} title="יצירת צוות">
        <TeamForm form={form} setForm={setForm} onCancel={() => { setCreateOpen(false); setError("") }} onSave={saveCreate} loading={loading} saveLabel="צור" error={error} />
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTeam} onClose={() => { setEditTeam(null); setError("") }} title="עריכת צוות">
        <TeamForm form={form} setForm={setForm} onCancel={() => { setEditTeam(null); setError("") }} onSave={saveEdit} loading={loading} saveLabel="שמור" error={error} />
      </Dialog>
    </div>
  )
}

function TeamForm({
  form,
  setForm,
  onCancel,
  onSave,
  loading,
  saveLabel,
  error,
}: {
  form: { name: string; type: "REGULAR" | "SPECIAL" }
  setForm: (f: { name: string; type: "REGULAR" | "SPECIAL" }) => void
  onCancel: () => void
  onSave: () => void
  loading: boolean
  saveLabel: string
  error?: string
}) {
  return (
    <div className="space-y-4">
      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      <Input
        label="שם הצוות"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="לדוגמה: צוות ירון"
      />

      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">סוג הצוות</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setForm({ ...form, type: "REGULAR" })}
            className={`p-3 rounded-lg border-2 text-left transition-colors ${
              form.type === "REGULAR"
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <p className="font-medium text-sm text-slate-900">רגיל</p>
            <p className="text-xs text-slate-500 mt-0.5">בקשות עוברות דרך ראש גדוד/ראש צוות</p>
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, type: "SPECIAL" })}
            className={`p-3 rounded-lg border-2 text-left transition-colors ${
              form.type === "SPECIAL"
                ? "border-amber-500 bg-amber-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <p className="font-medium text-sm text-slate-900 flex items-center gap-1">
              מיוחד <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
            </p>
            <p className="text-xs text-slate-500 mt-0.5">בקשות עוברות ישירות למחסן</p>
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">ביטול</Button>
        <Button onClick={onSave} loading={loading} className="flex-1">{saveLabel}</Button>
      </div>
    </div>
  )
}
