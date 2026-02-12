export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
    if (session.user.role !== "SUPPLIER" || !session.user.supplierId) {
      return NextResponse.json({ error: "Tedarikçi erişimi gerekli" }, { status: 403 });
    }

    const supplierId = session.user.supplierId;

    // Tedarikçi bilgileri
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, firmaAdi: true, telefon: true, email: true },
    });

    // Araç sayısı
    const vehicleCount = await prisma.vehicle.count({
      where: { supplierId },
    });

    // Araçlar ve projeleri
    const vehicles = await prisma.vehicle.findMany({
      where: { supplierId },
      select: {
        id: true,
        plaka: true,
        marka: true,
        model: true,
        driver: { select: { adSoyad: true } },
        projects: {
          select: {
            project: { select: { id: true, ad: true } },
          },
        },
      },
    });

    // Aylık puantaj istatistikleri (son 3 ay)
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    
    const vehicleIds = vehicles.map((v) => v.id);

    const timesheets = await prisma.timesheet.findMany({
      where: {
        vehicleId: { in: vehicleIds },
        OR: [
          { yil: { gt: threeMonthsAgo.getFullYear() } },
          {
            yil: threeMonthsAgo.getFullYear(),
            ay: { gte: threeMonthsAgo.getMonth() + 1 },
          },
        ],
      },
      select: {
        yil: true,
        ay: true,
        vehicleId: true,
        project: { select: { ad: true } },
        entries: {
          select: {
            seferSayisi: true,
            birimFiyatSnapshot: true,
          },
        },
      },
    });

    // Toplam sefer ve hakediş hesapla
    let totalTrips = 0;
    let totalRevenue = 0;
    timesheets.forEach((ts) => {
      ts.entries.forEach((entry) => {
        totalTrips += entry.seferSayisi;
        totalRevenue += entry.seferSayisi * entry.birimFiyatSnapshot;
      });
    });

    // Bu ay verileri
    const currentMonthTimesheets = timesheets.filter(
      (ts) => ts.yil === now.getFullYear() && ts.ay === now.getMonth() + 1
    );
    let currentMonthTrips = 0;
    let currentMonthRevenue = 0;
    currentMonthTimesheets.forEach((ts) => {
      ts.entries.forEach((entry) => {
        currentMonthTrips += entry.seferSayisi;
        currentMonthRevenue += entry.seferSayisi * entry.birimFiyatSnapshot;
      });
    });

    // Proje sayısı
    const projectIds = new Set<string>();
    vehicles.forEach((v) => v.projects.forEach((pv) => projectIds.add(pv.project.id)));

    return NextResponse.json({
      supplier,
      stats: {
        vehicleCount,
        projectCount: projectIds.size,
        totalTrips,
        totalRevenue,
        currentMonthTrips,
        currentMonthRevenue,
      },
      vehicles: vehicles.map((v) => ({
        id: v.id,
        plaka: v.plaka,
        marka: v.marka,
        model: v.model,
        driver: v.driver?.adSoyad || null,
        projects: v.projects.map((pv) => pv.project.ad),
      })),
    });
  } catch (error) {
    console.error("Supplier dashboard error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
