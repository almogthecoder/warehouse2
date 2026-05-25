"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"
import { Package, RotateCcw, Flag, CheckCircle, Star, ArrowRight } from "lucide-react"

interface OrderItem { item: { id: string; name: string; type: string }; quantity: number; returned: number }
interface ReturnLog { item: { name: string }; quantity: number; returnedAt: string }
interface SupplyOrder {
  id: string; status: string; notes?: string; createdAt: string; fulfilledAt?: string
  items: OrderItem[]
  team: { name: string; isBlacklisted: boolean }
  manager: { firstName: string; lastName: string }
  returnLogs: ReturnLog[]
}

interface DirectRequest {
  id: string; status: string; notes?: string; createdAt: string
  items: { item: { id: string; name: string; type: string }; quantity: number }[]
  worker: { firstName: string; lastName: string }
  team: { id: string; name: string; type: string }
}

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "outline" | "purple"> = {
  PENDING: "warning",
  FULFILLED: "success",
  FLAGGED: "destructive",
  COMPLETED: "purple",
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "ממתין",
  FULFILLED: "הועבר",
  FLAGGED: "מסומן",
  COMPLETED: "הושלם",
}

export default function OrdersPage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<SupplyOrder[]>([])
  const [directRequests, setDirectRequests] = useState<DirectRequest[]>([])
  const [selectedOrder, setSelectedOrder] = useState<SupplyOrder | null>(null)
  const [returnOpen, setReturnOpen] = useState(false)
  const [returnItems, setReturnItems] = useState<{ itemId: string; quantity: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState("ALL")

  const role = session?.user?.role ?? ""
  const isWarehouse = ["WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER"].includes(role)
  const canAct = isWarehouse
  const canBlacklist = ["WAREHOUSE_MANAGER", "REGIONAL_MANAGER"].includes(role)

  function load() {
    fetch("/api/orders").then((r) => r.json()).then((d) => setOrders(d.orders ?? []))
    if (isWarehouse) {
      fetch("/api/requests/direct").then((r) => r.json()).then((d) => setDirectRequests(d.requests ?? []))
    }
  }

  useEffect(() => { load() }, [role])

  async function acceptDirectRequest(req: DirectRequest) {
    setActionLoading(req.id)
    const items = req.items.map((ri) => ({ itemId: ri.item.id, quantity: ri.quantity }))
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, orderTeamId: req.team.id, requestIds: [req.id] }),
    })
    setActionLoading(null)
    if (res.ok) load()
  }

  async function fulfill(orderId: string) {
    setLoading(true)
    await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "fulfill" }) })
    setLoading(false); load()
  }

  async function submitReturns() {
    if (!selectedOrder) return
    const valid = returnItems.filter((r) => r.quantity > 0)
    setLoading(true)
    await fetch(`/api/orders/${selectedOrder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "return", returnItems: valid }),
    })
    setLoading(false); setReturnOpen(false); setSelectedOrder(null); load()
  }

  async function flagOrder(orderId: string, flagTeam: boolean) {
    setLoading(true)
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "flag", flagTeam }),
    })
    setLoading(false); load()
  }

  function openReturn(order: SupplyOrder) {
    setSelectedOrder(order)
    const reusable = order.items.filter((oi) => oi.item.type === "REUSABLE" && oi.returned < oi.quantity)
    setReturnItems(reusable.map((oi) => ({ itemId: oi.item.id, quantity: oi.quantity - oi.returned })))
    setReturnOpen(true)
  }

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.status === filter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">הזמנות ציוד</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">הכל</option>
          <option value="PENDING">ממתין</option>
          <option value="FULFILLED">הועבר</option>
          <option value="FLAGGED">מסומן</option>
          <option value="COMPLETED">הושלם</option>
        </select>
      </div>

      {/* Direct requests from Special teams */}
      {isWarehouse && directRequests.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <h2 className="text-sm font-semibold text-slate-700">בקשות ישירות — צוותים מיוחדים</h2>
            <Badge variant="warning" className="text-xs">{directRequests.length}</Badge>
          </div>
          <div className="space-y-2">
            {directRequests.map((req) => (
              <Card key={req.id} className="border-amber-200 bg-amber-50/40">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-slate-900">{req.team.name}</p>
                        <Badge variant="outline" className="text-xs">מיוחד</Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        מאת: {req.worker.firstName} {req.worker.lastName} · {formatDate(req.createdAt)}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {req.items.map((ri, i) => (
                          <span key={i} className="text-xs bg-white border border-slate-200 rounded px-1.5 py-0.5">
                            {ri.item.name} ×{ri.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => acceptDirectRequest(req)}
                      loading={actionLoading === req.id}
                      className="flex-shrink-0"
                    >
                      קבל <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <Package className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            לא נמצאו הזמנות.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const hasReusable = order.items.some((oi) => oi.item.type === "REUSABLE")
            const unreturned = order.items.filter((oi) => oi.item.type === "REUSABLE" && oi.returned < oi.quantity)

            return (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{order.team.name}</p>
                        {order.team.isBlacklisted && <Badge variant="destructive">ברשימה שחורה</Badge>}
                      </div>
                      <p className="text-sm text-slate-500">
                        {order.manager.firstName} {order.manager.lastName}
                      </p>
                      <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                    </div>
                    <Badge variant={STATUS_COLORS[order.status] ?? "outline"}>{STATUS_LABELS[order.status] ?? order.status}</Badge>
                  </div>

                  <div className="space-y-1 mb-3">
                    {order.items.map((oi, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="text-slate-700">{oi.item.name}</span>
                        <span className="text-slate-400">×{oi.quantity}</span>
                        <Badge variant={oi.item.type === "REUSABLE" ? "purple" : "outline"} className="text-xs">
                          {oi.item.type === "REUSABLE" ? "לא מתכלה" : "מתכלה"}
                        </Badge>
                        {oi.item.type === "REUSABLE" && oi.returned > 0 && (
                          <span className="text-xs text-green-600">({oi.returned} הוחזרו)</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {canAct && (
                    <div className="flex flex-wrap gap-2 border-t pt-3">
                      {order.status === "PENDING" && (
                        <Button size="sm" onClick={() => fulfill(order.id)} loading={loading}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" /> סמן כניתן
                        </Button>
                      )}
                      {order.status === "FULFILLED" && hasReusable && unreturned.length > 0 && (
                        <Button size="sm" variant="outline" onClick={() => openReturn(order)}>
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> רשום החזרות
                        </Button>
                      )}
                      {order.status === "FULFILLED" && unreturned.length > 0 && canBlacklist && (
                        <Button size="sm" variant="destructive" onClick={() => flagOrder(order.id, true)}>
                          <Flag className="w-3.5 h-3.5 mr-1" /> סמן ועצור צוות
                        </Button>
                      )}
                      {order.status === "FULFILLED" && unreturned.length > 0 && !canBlacklist && (
                        <Button size="sm" variant="outline" onClick={() => flagOrder(order.id, false)}>
                          <Flag className="w-3.5 h-3.5 mr-1" /> סמן צוות
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={returnOpen} onClose={() => setReturnOpen(false)} title="רישום החזרת ציוד">
        <div className="space-y-3">
          <p className="text-sm text-slate-600">הכנס כמויות שהוחזרו עבור פריטים לא מתכלים:</p>
          {returnItems.map((ri, i) => {
            const oi = selectedOrder?.items.find((x) => x.item.id === ri.itemId)
            if (!oi) return null
            return (
              <div key={ri.itemId} className="flex items-center gap-3">
                <span className="flex-1 text-sm">{oi.item.name} (נדרש {oi.quantity - oi.returned})</span>
                <input
                  type="number" min={0} max={oi.quantity - oi.returned}
                  value={ri.quantity}
                  onChange={(e) => setReturnItems((prev) => prev.map((x, j) => j === i ? { ...x, quantity: parseInt(e.target.value) || 0 } : x))}
                  className="w-16 text-sm border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )
          })}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setReturnOpen(false)} className="flex-1">ביטול</Button>
            <Button onClick={submitReturns} loading={loading} className="flex-1">שמור החזרות</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
