import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

async function main() {
  const existing = await prisma.user.findFirst({ where: { role: "CEO" } })
  if (existing) {
    console.log("CEO already exists, skipping seed.")
    return
  }

  const warehouse = await prisma.warehouse.create({
    data: { name: "Main Warehouse", address: "123 Warehouse St" },
  })

  const password = await bcrypt.hash("admin123", 12)
  const ceo = await prisma.user.create({
    data: {
      firstName: "Admin",
      lastName: "CEO",
      username: "admin",
      email: "admin@warehouse.local",
      password,
      role: "CEO",
      status: "ACTIVE",
      warehouseId: warehouse.id,
    },
  })

  console.log(`✅ Warehouse created: ${warehouse.name} (${warehouse.id})`)
  console.log(`✅ CEO created: ${ceo.username} / admin123`)
  console.log("🔒 Change the admin password after first login!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
