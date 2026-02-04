/**
 * Runs prisma migrate deploy with DIRECT_DATABASE_URL derived from DATABASE_URL if not set.
 * Neon pooler URL must use direct connection for migrations (advisory lock).
 */
const { execSync } = require("child_process");

const dbUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_DATABASE_URL;

if (!directUrl && dbUrl) {
  if (dbUrl.includes("-pooler")) {
    process.env.DIRECT_DATABASE_URL = dbUrl.replace(/-pooler\./, ".");
  } else {
    process.env.DIRECT_DATABASE_URL = dbUrl;
  }
}

execSync("prisma migrate deploy", { stdio: "inherit" });
