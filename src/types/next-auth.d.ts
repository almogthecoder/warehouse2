import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      firstName: string
      lastName: string
      email: string
      role: string
      status: string
      warehouseId: string | null
      teamId: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username: string
    firstName: string
    lastName: string
    role: string
    status: string
    warehouseId: string | null
    teamId: string | null
  }
}
