import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Role } from "@/generated/prisma"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const ROLE_LABELS: Record<Role, string> = {
  WORKER: "מדריך",
  TEAM_MANAGER: "ראש גדוד/ראש צוות",
  WAREHOUSE_WORKER: "איש מחסן",
  WAREHOUSE_MANAGER: "מנהל מחסן",
  REGIONAL_MANAGER: "מרכז",
  CEO: "הנהגה",
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  WORKER: 1,
  TEAM_MANAGER: 2,
  WAREHOUSE_WORKER: 3,
  WAREHOUSE_MANAGER: 4,
  REGIONAL_MANAGER: 5,
  CEO: 6,
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("he-IL", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
