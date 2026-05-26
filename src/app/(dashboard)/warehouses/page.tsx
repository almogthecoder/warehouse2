"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus, Warehouse, Pencil, Trash2 } from "lucide-react"

interface WarehouseItem {
  id: string; name: string; createdAt: string
  _count: { users: number; teams: number }
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<WarehouseItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<WarehouseItem | null>(null)
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
    setCreateOpen(false); setForm({ name: "" }); load()
  }

  async function save() {
    if (!editItem || !form.name.trim()) return
    setLoading(true); setError("")
    const res = await fetch(`/api/warehouses/${editItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "שגיאה"); return }
    setEditItem(null); setForm({ name: "" }); load()
  }

  async function remove() {
    if (!deleteItem) return
    setLoading(true)
    const res = await fetch(`/api/warehouses/${deleteItem.id}`, { method: "DELETE" })
    setLoading(false)
    if (!res.ok) { setError("שגיאה במחיקה"); return }
    setDeleteItem(null); load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">מחסנים</h1>
        <Button size="sm" onClick={() => { setForm({ name: "" }); setCreateOpen(true) }}>
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
                  <Warehouse className="w-5 h-5 text-indigo-600 shrink-0" />
                  <p className="font-semibold text-slate-900 flex-1">{wh.name}</p>
                  <button
                    onClick={() => { setEditItem(wh); setForm({ name: wh.name }); setError("") }}
                    className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setDeleteItem(wh); setError("") }}
                    className="p-1 rounded hover:bg-red-50 text-slate-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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

      {/* Create dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="יצירת מחסן">
        <div className="space-y-3">
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
          <Input label="שם המחסן" value={form.name} onChange={(e) => setForm({ name: e.target.value })} required />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="flex-1">ביטול</Button>
            <Button onClick={create} loading={loading} className="flex-1">צור מחסן</Button>
          </div>
        </div>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editItem} onClose={() => setEditItem(null)} title="עריכת מחסן">
        <div className="space-y-3">
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
          <Input label="שם המחסן" value={form.name} onChange={(e) => setForm({ name: e.target.value })} required />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditItem(null)} className="flex-1">ביטול</Button>
            <Button onClick={save} loading={loading} className="flex-1">שמור</Button>
          </div>
        </div>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteItem} onClose={() => setDeleteItem(null)} title="מחיקת מחסן">
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            האם למחוק את המחסן <span className="font-semibold text-slate-900">{deleteItem?.name}</span>?
            {(deleteItem?._count.users ?? 0) > 0 || (deleteItem?._count.teams ?? 0) > 0 ? (
              <span className="block mt-1 text-red-600">
                שים לב: למחסן זה יש {deleteItem?._count.users} משתמשים ו-{deleteItem?._count.teams} צוותים.
              </span>
            ) : null}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteItem(null)} className="flex-1">ביטול</Button>
            <Button variant="destructive" onClick={remove} loading={loading} className="flex-1">מחק</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
