import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fuelSchema } from "@/lib/validations";
import { requireAuth, getOrgFilter, getOrgId } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/fuel-entries?vehicleId=...&from=...&to=...
export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = { ...getOrgFilter(session!) };
    if (vehicleId) where.vehicleId = vehicleId;
    if (from || to) {
      where.tarih = {} as Record<string, Date>;
      if (from) (where.tarih as Record<string, Date>).gte = new Date(from);
      if (to) (where.tarih as Record<string, Date>).lte = new Date(to);
    }

    const entries = await prisma.fuelEntry.findMany({
      where,
      orderBy: { tarih: "desc" },
      include: {
        vehicle: {
          select: { id: true, plaka: true, marka: true, model: true },
        },
      },
    });

    const totals = entries.reduce(
      (acc, e) => {
        acc.toplamTutar += e.toplamTutar;
        acc.toplamLitre += e.litre;
        return acc;
      },
      { toplamTutar: 0, toplamLitre: 0 }
    );

    return NextResponse.json({ entries, totals });
  } catch (error) {
    console.error("[FuelEntry GET] error:", error);
    return NextResponse.json({ error: "Yakıt kayıtları alınamadı" }, { status: 500 });
  }
}

// POST /api/fuel-entries
export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const data = fuelSchema.parse(body);

    // Org doğrulama: araç gerçekten bu org'a mı ait?
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });
    if (!vehicle) {
      return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });
    }
    if (
      session!.user.organizationId &&
      vehicle.organizationId !== session!.user.organizationId
    ) {
      return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
    }

    const entry = await prisma.fuelEntry.create({
      data: {
        vehicleId: data.vehicleId,
        tarih: new Date(data.tarih),
        yakitTipi: data.yakitTipi,
        litre: data.litre,
        birimFiyat: data.birimFiyat,
        toplamTutar: data.toplamTutar,
        km: data.km,
        istasyon: data.istasyon ?? null,
        fisNo: data.fisNo ?? null,
        fisUrl: data.fisUrl ?? null,
        notlar: data.notlar ?? null,
        organizationId: getOrgId(session!) ?? null,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: unknown) {
    console.error("[FuelEntry POST] error:", error);
    if (error && typeof error === "object" && "errors" in error) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Yakıt kaydı oluşturulamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
