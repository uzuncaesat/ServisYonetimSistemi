import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getOrgFilter } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/sms/logs?limit=100&durum=SENT
export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10) || 100, 500);
    const durum = searchParams.get("durum");
    const tetikleyici = searchParams.get("tetikleyici");

    const where: Record<string, unknown> = { ...getOrgFilter(session!) };
    if (durum) where.durum = durum;
    if (tetikleyici) where.tetikleyici = tetikleyici;

    const logs = await prisma.smsLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const counts = await prisma.smsLog.groupBy({
      by: ["durum"],
      where: { ...getOrgFilter(session!) },
      _count: true,
    });

    return NextResponse.json({
      logs,
      counts: Object.fromEntries(counts.map((c) => [c.durum, c._count])),
    });
  } catch (error) {
    console.error("[SMS Logs] error:", error);
    return NextResponse.json({ error: "SMS logları alınamadı" }, { status: 500 });
  }
}
