import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getOrgFilter } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const orgFilter = getOrgFilter(session!);

    const [projects, suppliers, vehicles, drivers, routes, timesheets] =
      await Promise.all([
        prisma.project.count({ where: orgFilter }),
        prisma.supplier.count({ where: orgFilter }),
        prisma.vehicle.count({ where: orgFilter }),
        prisma.driver.count({ where: orgFilter }),
        prisma.route.count({ where: { project: orgFilter } }),
        prisma.timesheet.count({ where: { project: orgFilter } }),
      ]);

    // Son 30 gün puantaj trendi (gün bazlı sefer sayısı)
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 29);

    const recent = await prisma.timesheet.findMany({
      where: {
        project: orgFilter,
        date: { gte: start },
      },
      select: { date: true, tripCount: true },
    });

    const trendMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      trendMap.set(key, 0);
    }
    for (const entry of recent) {
      const key = entry.date.toISOString().slice(0, 10);
      trendMap.set(key, (trendMap.get(key) ?? 0) + (entry.tripCount ?? 0));
    }

    const trend = Array.from(trendMap.entries()).map(([date, value]) => ({
      date,
      value,
    }));

    const totalTrips = trend.reduce((acc, d) => acc + d.value, 0);

    return NextResponse.json({
      projects,
      suppliers,
      vehicles,
      drivers,
      routes,
      timesheets,
      trend,
      totalTrips,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "İstatistikler alınamadı" },
      { status: 500 }
    );
  }
}
