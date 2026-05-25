"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus, Warehouse } from "lucide-react"

interface Warehouse {
  id: string; name: string; createdAt: string
  _count: { users: number; teams: number }
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function load() {
    fetch("/api/warehouses").then((r) => r.json()).then((d) => setWarehouses(d.warehouses ?? []))
  }

  useEffect(() => { load() }, [])

  async function create() {
    if (!form.name.trim()) return
    setLoading(true); setError("")
    const res = await fetch("/api/warehouses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "שגיאה"); return }
    setOpen(false); setForm({ name: "" }); load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">מחסנים</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> מחסן חדש
        </Button>
      </div>

      {warehouses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <Warehouse className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            אין מחסנים עדיין.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((wh) => (
            <Card key={wh.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Warehouse className="w-5 h-5 text-indigo-600" />
                  <p className="font-semibold text-slate-900">{wh.name}</p>
                </div>
                <div className="flex gap-4 mt-2 text-sm text-slate-600">
                  <span>{wh._count.users} משתמשים</span>
                  <span>{wh._count.teams} צוותים</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="יצירת מחסן">
        <div className="space-y-3">
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
          <Input label="שם המחסן" value={form.name} onChange={(e) => setForm({ name: e.target.value })} required />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">ביטול</Button>
            <Button onClick={create} loading={loading} className="flex-1">צור מחסן</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
