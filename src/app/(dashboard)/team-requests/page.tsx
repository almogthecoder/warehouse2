"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/lib/utils"
import { Package, SendHorizonal, AlertCircle } from "lucide-react"

interface Item { id: string; name: string; type: string; section?: string }
interface RequestItem { item: Item; quantity: number }
interface WorkerRequest {
  id: string; status: string; notes?: string; createdAt: string
  items: RequestItem[]
  worker?: { firstName: string; lastName: string }
}

export default function TeamRequestsPage() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<WorkerRequest[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [orderOpen, setOrderOpen] = useState(false)
  const [extraItems, setExtraItems] = useState<{ itemId: string; quantity: number }[]>([])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  function load() {
    fetch("/api/requests").then((r) => r.json()).then((d) => setRequests(d.requests ?? []))
    fetch("/api/inventory").then((r) => r.json()).then((d) => setItems(d.items ?? []))
  }

  useEffect(() => { load() }, [])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function sendToWarehouse() {
    const validExtra = extraItems.filter((i) => i.itemId && i.quantity > 0)
    const allItems = buildAggregatedItems(validExtra)
    if (allItems.length === 0) { setError("לא נבחרו פריטים"); return }
    setLoading(true); setError("")

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: allItems,
        notes,
        requestIds: Array.from(selected),
      }),
    })

    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "שגיאה בשליחה"); return }
    setSuccess(true)
    load()
  }

  function buildAggregatedItems(extras: { itemId: string; quantity: number }[]) {
    const map = new Map<string, number>()
    requests.filter((r) => selected.has(r.id)).forEach((r) => {
      r.items.forEach((ri) => {
        map.set(ri.item.id, (map.get(ri.item.id) ?? 0) + ri.quantity)
      })
    })
    extras.forEach((e) => { map.set(e.itemId, (map.get(e.itemId) ?? 0) + e.quantity) })
    return Array.from(map.entries()).map(([itemId, quantity]) => ({ itemId, quantity }))
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-slate-900">הזמנת הציוד נשלחה למחסן!</p>
        <Button onClick={() => { setSuccess(false); setSelected(new Set()); setOrderOpen(false); load() }}>
          חזרה לבקשות
        </Button>
      </div>
    )
  }

  // Stale JWT guard: if the session still says WORKER, the user needs to re-login
  const sessionRole = session?.user?.role
  const sessionTeamId = session?.user?.teamId
  const isStaleSession = sessionRole === "WORKER" || (sessionRole === "TEAM_MANAGER" && !sessionTeamId)

  return (
    <div className="space-y-4">
      {isStaleSession && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>הפגישה שלך לא מעודכנת. אנא <button onClick={() => { window.location.href = "/login" }} className="font-semibold underline">התנתק והתחבר מחדש</button> כדי להחיל את התפקיד החדש שלך.</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">בקשות הצוות</h1>
          <p className="text-sm text-slate-500">{selected.size} נבחרו</p>
        </div>
        <Button
          size="sm"
          onClick={() => setOrderOpen(true)}
          disabled={selected.size === 0}
        >
          <SendHorizonal className="w-4 h-4 mr-1" /> שלח למחסן
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <Package className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            אין בקשות ממתינות מחברי הצוות.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card
              key={req.id}
              className={`cursor-pointer transition-all ${selected.has(req.id) ? "border-indigo-400 ring-1 ring-indigo-400" : ""}`}
              onClick={() => toggleSelect(req.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {req.worker ? `${req.worker.firstName} ${req.worker.lastName}` : "מדריך לא ידוע"}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(req.createdAt)}</p>
                    {req.notes && <p className="text-sm text-slate-600 mt-1">{req.notes}</p>}
                  </div>
                  <input
                    type="checkbox"
                    checked={selected.has(req.id)}
                    onChange={() => toggleSelect(req.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 accent-indigo-600 mt-1"
                  />
                </div>
                <div className="space-y-1">
                  {req.items.map((ri, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-slate-700">{ri.item.name}</span>
                      <span className="text-slate-400">×{ri.quantity}</span>
                      <Badge variant={ri.item.type === "REUSABLE" ? "purple" : "outline"} className="text-xs">
                        {ri.item.type === "REUSABLE" ? "Reusable" : "Burnable"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={orderOpen} onClose={() => setOrderOpen(false)} title="שליחת הזמנת ציוד למחסן">
        <div className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">פריטים מאוחדים מ-{selected.size} בקשות:</p>
            {buildAggregatedItems([]).map(({ itemId, quantity }) => {
              const item = items.find((i) => i.id === itemId)
              return item ? (
                <div key={itemId} className="flex items-center gap-2 text-sm py-1">
                  <span>{item.name}</span>
                  <span className="text-slate-400">×{quantity}</span>
                </div>
              ) : null
            })}
          </div>

          <div className="border-t pt-3">
            <p className="text-sm font-medium text-slate-700 mb-2">הוסף פריטים נוספים (לא חובה):</p>
            {extraItems.map((ei, i) => (
              <div key={i} className="flex gap-2 items-end mb-2">
                <Select value={ei.itemId} onChange={(e) => setExtraItems((prev) => prev.map((x, j) => j === i ? { ...x, itemId: e.target.value } : x))}>
                  <option value="">Select item...</option>
                  <option value="">בחר פריט...</option>
                  {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Select>
                <Input type="number" min={1} value={ei.quantity} className="w-20"
                  onChange={(e) => setExtraItems((prev) => prev.map((x, j) => j === i ? { ...x, quantity: parseInt(e.target.value) || 1 } : x))} />
                <Button variant="ghost" size="sm" onClick={() => setExtraItems((prev) => prev.filter((_, j) => j !== i))} className="text-red-500">✕</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setExtraItems((prev) => [...prev, { itemId: "", quantity: 1 }])}>
              + הוסף פריט
            </Button>
          </div>

          <Textarea label="הערות (לא חובה)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOrderOpen(false)} className="flex-1">ביטול</Button>
            <Button onClick={sendToWarehouse} loading={loading} className="flex-1">
              <SendHorizonal className="w-4 h-4 mr-1" /> שלח למחסן
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
