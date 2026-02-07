import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const DEFAULT_REPORT_TYPE_KEY = "default_report_price_type";

// GET - Ayarları getir (varsayılan rapor fiyat türü vb.)
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminAuth();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (key) {
      const setting = await prisma.setting.findUnique({
        where: { key },
      });
      return NextResponse.json(setting ? { key, value: setting.value } : null);
    }

    // Tüm ayarları getir
    const settings = await prisma.setting.findMany();
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

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error("Settings PATCH error:", error);
    return NextResponse.json(
      { error: "Ayar güncellenemedi" },
      { status: 500 }
    );
  }
}
