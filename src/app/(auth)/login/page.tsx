"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ username: "", password: "" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      window.location.href = "/dashboard"
    } else {
      const data = await res.json()
      setError(data.error ?? "Login failed")
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-center text-xl">כניסה למערכת</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          <Input
            label="שם משתמש"
            id="username"
            type="text"
            placeholder="הכנס שם משתמש"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            required
            autoComplete="username"
          />
          <Input
            label="סיסמה"
            id="password"
            type="password"
            placeholder="הכנס סיסמה"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {loading ? "מתחבר..." : "כניסה"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          אין לך חשבון?{" "}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            הרשמה
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
