"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import { formatDate, ROLE_LABELS } from "@/lib/utils"

interface Approval {
  id: string; firstName: string; lastName: string; username: string; email: string
  requestedRole: string; status: string; createdAt: string
  warehouse: { name: string }
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [reviewOpen, setReviewOpen] = useState(false)
  const [selected, setSelected] = useState<Approval | null>(null)
  const [action, setAction] = useState<"approve" | "reject">("approve")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function load() {
    fetch("/api/approvals").then((r) => r.json()).then((d) => setApprovals(d.approvals ?? []))
  }

  useEffect(() => { load() }, [])

  function openReview(approval: Approval, act: "approve" | "reject") {
    setSelected(approval); setAction(act); setNote(""); setError(""); setReviewOpen(true)
  }

  async function submitReview() {
    if (!selected) return
    setLoading(true); setError("")
    const res = await fetch(`/api/approvals/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewNote: note }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "שגיאה"); return }
    setReviewOpen(false); load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-slate-900">אישורים ממתינים</h1>
        {approvals.length > 0 && (
          <Badge variant="warning">{approvals.length}</Badge>
        )}
      </div>

      {approvals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <Clock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            אין בקשות אישור ממתינות.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {approvals.map((approval) => (
            <Card key={approval.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {approval.firstName} {approval.lastName}
                    </p>
                    <p className="text-sm text-slate-600">{approval.username} · {approval.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="purple">
                        {ROLE_LABELS[approval.requestedRole as keyof typeof ROLE_LABELS] ?? approval.requestedRole}
                      </Badge>
                      <span className="text-xs text-slate-500">@ {approval.warehouse.name}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(approval.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={() => openReview(approval, "reject")}>
                      <XCircle className="w-3.5 h-3.5 mr-1" /> דחה
                    </Button>
                    <Button size="sm" onClick={() => openReview(approval, "approve")}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> אשר
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} title={action === "approve" ? "אישור בקשה" : "דחיית בקשה"}>
        <div className="space-y-3">
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
          <p className="text-sm text-slate-700">
            {action === "approve"
              ? `אישור יצור חשבון פעיל עבור ${selected?.firstName} ${selected?.lastName}.`
              : `דחייה תסרב לבקשה מ-${selected?.firstName} ${selected?.lastName}.`}
          </p>
          <Input
            label="הערה (לא חובה)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="הוסף הערה..."
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setReviewOpen(false)} className="flex-1">ביטול</Button>
            <Button
              variant={action === "approve" ? "primary" : "destructive"}
              onClick={submitReview}
              loading={loading}
              className="flex-1"
            >
              {action === "approve" ? "אשר" : "דחה"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
