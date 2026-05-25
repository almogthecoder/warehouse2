"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ShieldBan, ShieldCheck } from "lucide-react"

interface Team { id: string; name: string; isBlacklisted: boolean; blacklistReason?: string }

export default function BlacklistPage() {
  const { data: session } = useSession()
  const [teams, setTeams] = useState<Team[]>([])
  const [blacklistOpen, setBlacklistOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const role = session?.user?.role ?? ""
  const canBlacklist = ["WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role)

  function load() {
    fetch("/api/teams").then((r) => r.json()).then((d) => setTeams(d.teams ?? []))
  }

  useEffect(() => { load() }, [])

  async function setBlacklist(team: Team, blacklist: boolean) {
    if (blacklist && !reason.trim()) return
    setLoading(true)
    await fetch(`/api/teams/${team.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBlacklisted: blacklist, blacklistReason: blacklist ? reason : null }),
    })
    setLoading(false); setBlacklistOpen(false); setSelectedTeam(null); setReason(""); load()
  }

  const blacklisted = teams.filter((t) => t.isBlacklisted)
  const active = teams.filter((t) => !t.isBlacklisted)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">רשימה שחורה</h1>

      <div>
        <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
          <ShieldBan className="w-4 h-4" /> צוותים ברשימה שחורה ({blacklisted.length})
        </h2>
        {blacklisted.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">אין צוותים ברשימה שחורה.</p>
        ) : (
          <div className="space-y-2">
            {blacklisted.map((team) => (
              <Card key={team.id} className="border-red-200 bg-red-50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{team.name}</p>
                      <Badge variant="destructive">ברשימה שחורה</Badge>
                    </div>
                    {team.blacklistReason && (
                      <p className="text-sm text-red-700 mt-0.5">סיבה: {team.blacklistReason}</p>
                    )}
                  </div>
                  {canBlacklist && (
                    <Button size="sm" variant="outline" onClick={() => setBlacklist(team, false)} loading={loading}>
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> הסר
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {canBlacklist && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">צוותים פעילים</h2>
          {active.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">אין צוותים פעילים.</p>
          ) : (
            <div className="space-y-2">
              {active.map((team) => (
                <Card key={team.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <p className="font-medium text-slate-900">{team.name}</p>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => { setSelectedTeam(team); setBlacklistOpen(true) }}
                    >
                      <ShieldBan className="w-3.5 h-3.5 mr-1" /> הוסף לרשימה
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={blacklistOpen} onClose={() => setBlacklistOpen(false)} title={`הוספה לרשימה שחורה: ${selectedTeam?.name}`}>
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            צוות זה יחסם מהגשת בקשות ציוד.
          </p>
          <Input
            label="סיבה"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="לדוגמה: לא החזיר ציוד לא מתכלה"
            required
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBlacklistOpen(false)} className="flex-1">ביטול</Button>
            <Button variant="destructive" onClick={() => selectedTeam && setBlacklist(selectedTeam, true)} loading={loading} className="flex-1">
              הוסף לרשימה שחורה
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
