"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Warehouse {
  id: string
  name: string
}

interface Team {
  id: string
  name: string
  type: "REGULAR" | "SPECIAL"
}

const MANAGER_ROLES = [
  { value: "TEAM_MANAGER", label: "ראש גדוד/ראש צוות" },
  { value: "WAREHOUSE_WORKER", label: "איש מחסן" },
  { value: "WAREHOUSE_MANAGER", label: "מנהל מחסן" },
  { value: "REGIONAL_MANAGER", label: "מרכז" },
]

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "WORKER",
    warehouseId: "",
    teamId: "",
  })

  useEffect(() => {
    fetch("/api/warehouses?public=true")
      .then((r) => r.json())
      .then((data) => setWarehouses(data.warehouses ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (form.role === "WORKER" && form.warehouseId) {
      fetch(`/api/teams?public=true&warehouseId=${form.warehouseId}`)
        .then((r) => r.json())
        .then((data) => setTeams(data.teams ?? []))
        .catch(() => setTeams([]))
    } else {
      setTeams([])
      setForm((f) => ({ ...f, teamId: "" }))
    }
  }, [form.warehouseId, form.role])

  const isManagerRole = form.role !== "WORKER"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (!form.warehouseId) {
      setError("Please select a warehouse")
      return
    }

    setLoading(true)
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
        warehouseId: form.warehouseId,
        teamId: form.role === "WORKER" ? form.teamId || null : null,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? "אירעה שגיאה")
      return
    }

    if (form.role === "WORKER") {
      router.push("/login?registered=true")
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-sm shadow-lg border-0">
        <CardContent className="pt-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">הבקשה נשלחה!</h2>
          <p className="text-sm text-slate-600">
            בקשתך להצטרף כמנהל ממתינה לאישור המרכז.
            תוכל להתחבר לאחר האישור.
          </p>
          <Link href="/login">
            <Button className="w-full mt-2">חזרה לכניסה</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-center text-xl">יצירת חשבון</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="שם פרטי"
              id="firstName"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              required
            />
            <Input
              label="שם משפחה"
              id="lastName"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              required
            />
          </div>
          <Input
            label="שם משתמש"
            id="username"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            required
            autoComplete="username"
          />
          <Input
            label="אימייל"
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <Input
            label="סיסמה"
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
          <Input
            label="אימות סיסמה"
            id="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            required
          />
          <Select
            label="תפקיד"
            id="role"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value, teamId: "" }))}
          >
            <option value="WORKER">מדריך</option>
            {MANAGER_ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>

          {isManagerRole && (
            <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              תפקידי ניהול דורשים אישור מהמרכז לפני הכניסה למערכת.
            </div>
          )}

          <Select
            label="מחסן"
            id="warehouseId"
            value={form.warehouseId}
            onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value, teamId: "" }))}
            required
          >
            <option value="">בחר מחסן...</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </Select>

          {form.role === "WORKER" && form.warehouseId && (
            <Select
              label="צוות (לא חובה)"
              id="teamId"
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

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {isManagerRole ? "שלח לאישור" : "צור חשבון"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          כבר יש לך חשבון?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            כניסה
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
