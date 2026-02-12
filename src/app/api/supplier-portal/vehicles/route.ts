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

    const vehicles = await prisma.vehicle.findMany({
      where: { supplierId: session.user.supplierId },
      select: {
        id: true,
        plaka: true,
        marka: true,
        model: true,
        kisiSayisi: true,
        driver: { select: { adSoyad: true, telefon: true } },
        projects: {
          select: {
            project: { select: { id: true, ad: true } },
            vehicleRoutes: {
              select: {
                route: { select: { ad: true, birimFiyat: true } },
              },
            },
          },
        },
      },
      orderBy: { plaka: "asc" },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("Supplier vehicles error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
