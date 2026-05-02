import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { vehicleExpenseSchema } from "@/lib/validations";
import { requireAuth, getOrgFilter, getOrgId } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/vehicle-expenses?vehicleId=...&kategori=...&from=...&to=...
export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get("vehicleId");
    const kategori = searchParams.get("kategori");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = { ...getOrgFilter(session!) };
    if (vehicleId) where.vehicleId = vehicleId;
    if (kategori) where.kategori = kategori;
    if (from || to) {
      where.tarih = {} as Record<string, Date>;
      if (from) (where.tarih as Record<string, Date>).gte = new Date(from);
      if (to) (where.tarih as Record<string, Date>).lte = new Date(to);
    }

    const expenses = await prisma.vehicleExpense.findMany({
      where,
      orderBy: { tarih: "desc" },
      include: {
        vehicle: { select: { id: true, plaka: true, marka: true, model: true } },
      },
    });

    const grouped = expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.kategori] = (acc[e.kategori] ?? 0) + e.tutar;
      return acc;
    }, {});
    const total = expenses.reduce((s, e) => s + e.tutar, 0);

    return NextResponse.json({ expenses, totals: { total, byCategory: grouped } });
  } catch (error) {
    console.error("[VehicleExpense GET] error:", error);
    return NextResponse.json({ error: "Giderler alınamadı" }, { status: 500 });
  }
}

// POST /api/vehicle-expenses
export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const data = vehicleExpenseSchema.parse(body);

    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });
    if (
      session!.user.organizationId &&
      vehicle.organizationId !== session!.user.organizationId
    ) {
      return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
    }

    const expense = await prisma.vehicleExpense.create({
      data: {
        vehicleId: data.vehicleId,
        tarih: new Date(data.tarih),
        kategori: data.kategori,
        altKategori: data.altKategori ?? null,
        tutar: data.tutar,
        kdvDahil: data.kdvDahil,
        km: data.km ?? null,
        saglayici: data.saglayici ?? null,
        belgeNo: data.belgeNo ?? null,
        garantiBitis: data.garantiBitis ? new Date(data.garantiBitis) : null,
        notlar: data.notlar ?? null,
        fisUrl: data.fisUrl ?? null,
        organizationId: getOrgId(session!) ?? null,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: unknown) {
    console.error("[VehicleExpense POST] error:", error);
    if (error && typeof error === "object" && "errors" in error) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Gider oluşturulamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
