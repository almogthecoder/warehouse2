import { cn } from "@/lib/utils"
import type { HTMLAttributes } from "react"

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "outline" | "purple"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-indigo-100 text-indigo-800": variant === "default",
          "bg-green-100 text-green-800": variant === "success",
          "bg-amber-100 text-amber-800": variant === "warning",
          "bg-red-100 text-red-800": variant === "destructive",
          "border border-slate-200 text-slate-700 bg-white": variant === "outline",
          "bg-violet-100 text-violet-800": variant === "purple",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
