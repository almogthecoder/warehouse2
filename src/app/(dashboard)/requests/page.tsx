"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Plus, Package } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Item { id: string; name: string; type: string; quantity: number; section?: string }
interface RequestItem { item: Item; quantity: number }
interface WorkerRequest {
  id: string; status: string; notes?: string; createdAt: string
  items: RequestItem[]
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "טיוטה", PENDING: "ממתין", INCLUDED: "נכלל בהזמנה", REJECTED: "נדחה",
}
const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "outline" | "purple"> = {
  DRAFT: "outline", PENDING: "warning", INCLUDED: "success", REJECTED: "destructive",
}

export default function RequestsPage() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<WorkerRequest[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedItems, setSelectedItems] = useState<{ itemId: string; quantity: number }[]>([])
  const [notes, setNotes] = useState("")

  function loadRequests() {
    fetch("/api/requests").then((r) => r.json()).then((d) => setRequests(d.requests ?? []))
  }

  function loadItems() {
    fetch("/api/inventory").then((r) => r.json()).then((d) => setItems(d.items ?? []))
  }

  useEffect(() => { loadRequests(); loadItems() }, [])

  function addItem() {
    setSelectedItems((prev) => [...prev, { itemId: "", quantity: 1 }])
  }

  function updateItem(index: number, field: "itemId" | "quantity", value: string | number) {
    setSelectedItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function removeItem(index: number) {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index))
  }

  async function submitRequest() {
    const validItems = selectedItems.filter((i) => i.itemId && i.quantity > 0)
    if (validItems.length === 0) { setError("יש להוסיף לפחות פריט אחד"); return }
    setLoading(true); setError("")

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: validItems, notes }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? "שגיאה בשליחה"); return }
    setOpen(false); setSelectedItems([]); setNotes(""); loadRequests()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">הבקשות שלי</h1>
        <Button size="sm" onClick={() => { setOpen(true); setSelectedItems([{ itemId: "", quantity: 1 }]) }}>
          <Plus className="w-4 h-4 mr-1" /> בקשה חדשה
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <Package className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            אין בקשות עדיין. צור בקשה חדשה להתחיל.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs text-slate-500">{formatDate(req.createdAt)}</p>
                    {req.notes && <p className="text-sm text-slate-600 mt-1">{req.notes}</p>}
                  </div>
                  <Badge variant={STATUS_COLORS[req.status] ?? "outline"}>{STATUS_LABELS[req.status] ?? req.status}</Badge>
                </div>
                <div className="space-y-1">
                  {req.items.map((ri, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-slate-700">{ri.item.name}</span>
                      <span className="text-slate-400">×{ri.quantity}</span>
                      <Badge variant={ri.item.type === "REUSABLE" ? "purple" : "outline"} className="text-xs">
                        {ri.item.type === "REUSABLE" ? "לא מתכלה" : "מתכלה"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="בקשת ציוד חדשה">
        <div className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
          <div className="space-y-2">
            {selectedItems.map((si, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label={i === 0 ? "פריט" : undefined}
                    value={si.itemId}
                    onChange={(e) => updateItem(i, "itemId", e.target.value)}
                  >
                    <option value="">בחר פריט...</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.type === "REUSABLE" ? "לא מתכלה" : "מתכלה"}) — {item.section ?? "ללא מיקום"}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-20">
                  <Input
                    label={i === 0 ? "כמות" : undefined}
                    type="number"
                    min={1}
                    value={si.quantity}
                    onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 mb-0.5">✕</Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addItem} className="w-full">+ הוסף פריט</Button>
          <Input
            label="הערות (לא חובה)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="הערות לראש הצוות..."
          />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">ביטול</Button>
            <Button onClick={submitRequest} loading={loading} className="flex-1">שלח לראש הצוות</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
