import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEditFactoryPrice, canGenerateFactoryReport, canManageUsers } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Get session for API routes. Returns 401 JSON if not authenticated.
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 }) };
  }
  return { session, error: null };
}

/**
 * Require ADMIN or MANAGER for factory report generation.
 */
export async function requireFactoryReportAuth() {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };
  if (!canGenerateFactoryReport(session!.user.role)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Bu raporu oluşturma yetkiniz yok" }, { status: 403 }),
    };
  }
  return { session, error: null };
}

/**
 * Require ADMIN for editing factory price.
 */
export async function requireFactoryPriceEditAuth() {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };
  if (!canEditFactoryPrice(session!.user.role)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Fabrika fiyatı düzenleme yetkiniz yok" }, { status: 403 }),
    };
  }
  return { session, error: null };
}

/**
 * Require ADMIN for user management.
 */
export async function requireAdminAuth() {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };
  if (!canManageUsers(session!.user.role)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Kullanıcı yönetimi yetkiniz yok" }, { status: 403 }),
    };
  }
  return { session, error: null };
}
