import type { Role } from "@/generated/prisma"

export const MANAGER_ROLES: Role[] = [
  "TEAM_MANAGER",
  "WAREHOUSE_WORKER",
  "WAREHOUSE_MANAGER",
  "REGIONAL_MANAGER",
  "CEO",
]

export const WAREHOUSE_ROLES: Role[] = [
  "WAREHOUSE_WORKER",
  "WAREHOUSE_MANAGER",
  "REGIONAL_MANAGER",
  "CEO",
]

export function canManageUsers(role: string) {
  return ["REGIONAL_MANAGER", "CEO"].includes(role)
}

export function canManageInventory(role: string) {
  return ["WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role)
}

export function canBlacklistTeams(role: string) {
  return ["WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role)
}

export function canApproveManagers(role: string) {
  return ["REGIONAL_MANAGER", "CEO"].includes(role)
}

export function canSeeSupplyOrders(role: string) {
  return ["WAREHOUSE_WORKER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role)
}

export function canManageWarehouses(role: string) {
  return role === "CEO"
}

export function isTeamManager(role: string) {
  return role === "TEAM_MANAGER"
}

export function isWorker(role: string) {
  return role === "WORKER"
}

export function canCreateOwnOrder(role: string) {
  return ["TEAM_MANAGER", "WAREHOUSE_MANAGER", "REGIONAL_MANAGER", "CEO"].includes(role)
}
