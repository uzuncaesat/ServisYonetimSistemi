/**
 * Ensures admin and manager users exist.
 * Uses ADMIN_PASSWORD and MANAGER_PASSWORD from env.
 * Run: npx tsx prisma/ensure-admin.ts
 * Also runs during build (see scripts/ensure-admin.js).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set, skipping ensure-admin");
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const managerPassword = process.env.MANAGER_PASSWORD || "manager123";

  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: "admin@uzhanerp.com" },
    update: { role: "ADMIN" }, // Şifre sadece create'te set edilir, update'te değiştirilmez
    create: {
      email: "admin@uzhanerp.com",
      password: hashedAdminPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });
  console.log("Admin user ensured: admin@uzhanerp.com");

  const hashedManagerPassword = await bcrypt.hash(managerPassword, 10);
  await prisma.user.upsert({
    where: { email: "yonetici@uzhanerp.com" },
    update: { role: "MANAGER" },
    create: {
      email: "yonetici@uzhanerp.com",
      password: hashedManagerPassword,
      name: "Yönetici",
      role: "MANAGER",
    },
  });
  console.log("Manager user ensured: yonetici@uzhanerp.com");
}

main()
  .catch((e) => {
    console.error("ensure-admin error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
