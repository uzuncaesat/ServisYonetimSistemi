import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth, getOrgFilter, getOrgId } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const DEFAULT_REPORT_TYPE_KEY = "default_report_price_type";

// GET - Ayarları getir (varsayılan rapor fiyat türü vb.)
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminAuth();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    const orgFilter = getOrgFilter(auth.session!);

    if (key) {
      const setting = await prisma.setting.findFirst({
        where: { key, ...orgFilter },
      });
      return NextResponse.json(setting ? { key, value: setting.value } : null);
    }

    // Tüm ayarları getir
    const settings = await prisma.setting.findMany({
      where: orgFilter,
    });
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "Ayarlar alınamadı" },
      { status: 500 }
    );
  }
}

// PATCH - Ayar güncelle (sadece ADMIN)
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdminAuth();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { key, value } = body;

    if (!key || typeof value !== "string") {
      return NextResponse.json(
        { error: "key ve value zorunludur" },
        { status: 400 }
      );
    }

    const orgFilter = getOrgFilter(auth.session!);
    const orgId = getOrgId(auth.session!);

    // Find existing setting for this org
    const existing = await prisma.setting.findFirst({
      where: { key, ...orgFilter },
    });

    let setting;
    if (existing) {
      setting = await prisma.setting.update({
        where: { id: existing.id },
        data: { value },
      });
    } else {
      setting = await prisma.setting.create({
        data: { key, value, organizationId: orgId },
      });
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error("Settings PATCH error:", error);
    return NextResponse.json(
      { error: "Ayar güncellenemedi" },
      { status: 500 }
    );
  }
}
