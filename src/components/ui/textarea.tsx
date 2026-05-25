import { cn } from "@/lib/utils"
import { type TextareaHTMLAttributes, forwardRef } from "react"

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            "w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder:text-slate-400 resize-none",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
            "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
            error ? "border-red-400" : "border-slate-300",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
