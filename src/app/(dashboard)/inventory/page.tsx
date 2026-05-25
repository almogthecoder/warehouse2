"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Package } from "lucide-react"

interface Item { id: string; name: string; type: string; quantity: number; section?: string }

export default function InventoryPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<Item[]>([])
  const [canEdit, setCanEdit] = useState(false)
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({ name: "", type: "BURNABLE", quantity: "0", section: "" })

  function load() {
    fetch("/api/inventory").then((r) => r.json()).then((d) => {
      setItems(d.items ?? [])
      setCanEdit(d.canEdit ?? false)
    })
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditItem(null)
    setForm({ name: "", type: "BURNABLE", quantity: "0", section: "" })
    setOpen(true)
  }

  function openEdit(item: Item) {
    setEditItem(item)
    setForm({ name: item.name, type: item.type, quantity: String(item.quantity), section: item.section ?? "" })
    setOpen(true)
  }

  async function saveItem() {
    setLoading(true); setError("")
    const body = { name: form.name, type: form.type, quantity: parseInt(form.quantity) || 0, section: form.section || null }

    const res = editItem
      ? await fetch(`/api/inventory/${editItem.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })

    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "שגיאה בשמירה"); return }
    setOpen(false); load()
  }

  async function deleteItem(id: string) {
    if (!confirm("למחוק פריט זה?")) return
    await fetch(`/api/inventory/${id}`, { method: "DELETE" })
    load()
  }

  const sections = Array.from(new Set(items.map((i) => i.section ?? "").filter(Boolean)))
  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.section ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const grouped = filtered.reduce<Record<string, Item[]>>((acc, item) => {
    const sec = item.section ?? "ללא מיקום"
    if (!acc[sec]) acc[sec] = []
    acc[sec].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">מלאי</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="חיפוש פריטים..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
          {canEdit && (
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-1" /> הוסף פריט
            </Button>
          )}
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <Package className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            לא נמצאו פריטים.
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([section, sectionItems]) => (
          <div key={section}>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">{section}</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sectionItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={item.type === "REUSABLE" ? "purple" : "default"}>
                            {item.type === "REUSABLE" ? "לא מתכלה" : "מתכלה"}
                          </Badge>
                          <span className="text-sm text-slate-600">כמות: <strong>{item.quantity}</strong></span>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteItem(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={editItem ? "עריכת פריט" : "הוספת פריט"}>
        <div className="space-y-3">
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
          <Input label="שם" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Select label="סוג" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="BURNABLE">מתכלה (מתכלה, ללא החזרה)</option>
            <option value="REUSABLE">לא מתכלה (חייב החזרה)</option>
          </Select>
          <Input label="כמות" type="number" min={0} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
          <Input label="מיקום (לא חובה)" value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} placeholder="לדוגמה: מדף א׳, חדר אחסון" />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">ביטול</Button>
            <Button onClick={saveItem} loading={loading} className="flex-1">{editItem ? "שמור שינויים" : "הוסף פריט"}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
