import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Puantaj girişlerini getir
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entries = await prisma.timesheetEntry.findMany({
      where: { timesheetId: params.id },
      include: {
        route: true,
      },
      orderBy: [{ tarih: "asc" }, { routeId: "asc" }],
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Timesheet entries GET error:", error);
    return NextResponse.json(
      { error: "Girişler alınamadı" },
      { status: 500 }
    );
  }
}

// POST - Puantaj girişi ekle veya güncelle
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { tarih, routeId, seferSayisi } = body;

    if (!tarih || !routeId || seferSayisi === undefined) {
      return NextResponse.json(
        { error: "Tarih, güzergah ve sefer sayısı zorunludur" },
        { status: 400 }
      );
    }

    // Get route for snapshot
    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return NextResponse.json(
        { error: "Güzergah bulunamadı" },
        { status: 404 }
      );
    }

    // Parse tarih to ensure it's a valid Date
    const tarihDate = new Date(tarih);

    // Upsert entry
    const entry = await prisma.timesheetEntry.upsert({
      where: {
        timesheetId_tarih_routeId: {
          timesheetId: params.id,
          tarih: tarihDate,
          routeId,
        },
      },
      update: {
        seferSayisi: parseInt(seferSayisi),
      },
      create: {
        timesheetId: params.id,
        tarih: tarihDate,
        routeId,
        seferSayisi: parseInt(seferSayisi),
        birimFiyatSnapshot: route.birimFiyat,
        fabrikaFiyatSnapshot: route.fabrikaFiyati,
        kdvOraniSnapshot: route.kdvOrani,
      },
      include: {
        route: true,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Timesheet entry POST error:", error);
    return NextResponse.json(
      { error: "Giriş kaydedilemedi" },
      { status: 500 }
    );
  }
}

// PUT - Toplu puantaj girişi güncelle
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { entries } = body;

    if (!Array.isArray(entries)) {
      return NextResponse.json(
        { error: "Geçersiz veri formatı" },
        { status: 400 }
      );
    }

    // Get all routes for snapshots
    const routeIds = [...new Set(entries.map((e: { routeId: string }) => e.routeId))];
    const routes = await prisma.route.findMany({
      where: { id: { in: routeIds as string[] } },
    });
    const routeMap = new Map(routes.map((r) => [r.id, r]));

    // Process entries
    const results = [];
    for (const entry of entries) {
      const { tarih, routeId, seferSayisi } = entry;
      const route = routeMap.get(routeId);

      if (!route) continue;

      const tarihDate = new Date(tarih);

      if (seferSayisi === 0) {
        // Delete entry if sefer is 0
        await prisma.timesheetEntry.deleteMany({
          where: {
            timesheetId: params.id,
            tarih: tarihDate,
            routeId,
          },
        });
      } else {
        // Upsert entry
        const result = await prisma.timesheetEntry.upsert({
          where: {
            timesheetId_tarih_routeId: {
              timesheetId: params.id,
              tarih: tarihDate,
              routeId,
            },
          },
          update: {
            seferSayisi: parseInt(seferSayisi),
          },
          create: {
            timesheetId: params.id,
            tarih: tarihDate,
            routeId,
            seferSayisi: parseInt(seferSayisi),
            birimFiyatSnapshot: route.birimFiyat,
            fabrikaFiyatSnapshot: route.fabrikaFiyati,
            kdvOraniSnapshot: route.kdvOrani,
          },
        });
        results.push(result);
      }
    }

    // Return updated entries
    const updatedEntries = await prisma.timesheetEntry.findMany({
      where: { timesheetId: params.id },
      include: { route: true },
      orderBy: [{ tarih: "asc" }, { routeId: "asc" }],
    });

    return NextResponse.json(updatedEntries);
  } catch (error) {
    console.error("Timesheet entries PUT error:", error);
    return NextResponse.json(
      { error: "Girişler güncellenemedi" },
      { status: 500 }
    );
  }
}
