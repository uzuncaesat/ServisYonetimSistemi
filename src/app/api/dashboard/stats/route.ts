import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getOrgFilter } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const orgFilter = getOrgFilter(session!);

    const [projects, suppliers, vehicles, drivers, routes, timesheets] = await Promise.all([
      prisma.project.count({ where: orgFilter }),
      prisma.supplier.count({ where: orgFilter }),
      prisma.vehicle.count({ where: orgFilter }),
      prisma.driver.count({ where: orgFilter }),
      prisma.route.count({ where: { project: orgFilter } }),
      prisma.timesheet.count({ where: { project: orgFilter } }),
    ]);

    return NextResponse.json({
      projects,
      suppliers,
      vehicles,
      drivers,
      routes,
      timesheets,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "İstatistikler alınamadı" },
      { status: 500 }
    );
  }
}
