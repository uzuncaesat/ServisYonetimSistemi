export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
    if (session.user.role !== "SUPPLIER" || !session.user.supplierId) {
      return NextResponse.json({ error: "Tedarikçi erişimi gerekli" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const yil = parseInt(searchParams.get("yil") || String(new Date().getFullYear()));
    const ay = parseInt(searchParams.get("ay") || String(new Date().getMonth() + 1));

    // Tedarikçiye ait araç ID'leri
    const vehicles = await prisma.vehicle.findMany({
      where: { supplierId: session.user.supplierId },
      select: { id: true },
    });
    const vehicleIds = vehicles.map((v) => v.id);

    // Puantajlar
    const timesheets = await prisma.timesheet.findMany({
      where: {
        vehicleId: { in: vehicleIds },
        yil,
        ay,
      },
      select: {
        id: true,
        yil: true,
        ay: true,
        vehicle: { select: { plaka: true, marka: true } },
        project: { select: { ad: true } },
        entries: {
          select: {
            tarih: true,
            seferSayisi: true,
            birimFiyatSnapshot: true,
            route: { select: { ad: true } },
          },
          orderBy: { tarih: "asc" },
        },
      },
      orderBy: [{ project: { ad: "asc" } }, { vehicle: { plaka: "asc" } }],
    });

    // Toplam hesapla
    const summary = timesheets.map((ts) => {
      let toplamSefer = 0;
      let toplamTutar = 0;
      ts.entries.forEach((e) => {
        toplamSefer += e.seferSayisi;
        toplamTutar += e.seferSayisi * e.birimFiyatSnapshot;
      });
      return {
        ...ts,
        toplamSefer,
        toplamTutar,
      };
    });

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Supplier timesheets error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
