/**
 * Ensures admin and manager users exist. Runs after migrate-deploy during build.
 * Uses ADMIN_PASSWORD and MANAGER_PASSWORD from env (same as seed).
 * Safe to run on every deploy - uses upsert, no demo data.
 */
const { execSync } = require("child_process");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const scriptPath = path.join(rootDir, "prisma", "ensure-admin.ts");

try {
  execSync(`npx tsx prisma/ensure-admin.ts`, {
    stdio: "inherit",
    cwd: rootDir,
    env: { ...process.env },
  });
} catch (err) {
  // Don't fail build if ensure-admin fails
  console.warn("ensure-admin skipped or failed");
}
