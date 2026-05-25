import type { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
          <span className="text-2xl leading-none">🦚</span>
        </div>
        <div>
          <p className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent leading-tight">
            שבט משגב
          </p>
          <p className="text-xs text-slate-500 leading-tight">ניהול מחסן הציוד</p>
        </div>
      </div>
      {children}
    </div>
  )
}
