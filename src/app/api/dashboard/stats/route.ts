import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [projects, suppliers, vehicles, drivers, routes, timesheets] = await Promise.all([
      prisma.project.count(),
      prisma.supplier.count(),
      prisma.vehicle.count(),
      prisma.driver.count(),
      prisma.route.count(),
      prisma.timesheet.count(),
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
