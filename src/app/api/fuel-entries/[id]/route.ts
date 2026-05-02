import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fuelSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

async function checkAccess(id: string, sessionOrgId: string | null | undefined) {
  const entry = await prisma.fuelEntry.findUnique({ where: { id } });
  if (!entry) return { entry: null, response: NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 }) };
  if (sessionOrgId && entry.organizationId !== sessionOrgId) {
    return { entry: null, response: NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 }) };
  }
  return { entry, response: null };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    const { entry, response } = await checkAccess(params.id, session!.user.organizationId);
    if (response) return response;
    return NextResponse.json(entry);
  } catch (error) {
    console.error("[FuelEntry GET id] error:", error);
    return NextResponse.json({ error: "Kayıt alınamadı" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    const { response } = await checkAccess(params.id, session!.user.organizationId);
    if (response) return response;

    const body = await req.json();
    const data = fuelSchema.parse(body);

    const entry = await prisma.fuelEntry.update({
      where: { id: params.id },
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
      },
    });

    return NextResponse.json(entry);
  } catch (error: unknown) {
    console.error("[FuelEntry PUT] error:", error);
    if (error && typeof error === "object" && "errors" in error) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Kayıt güncellenemedi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    const { response } = await checkAccess(params.id, session!.user.organizationId);
    if (response) return response;

    await prisma.fuelEntry.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FuelEntry DELETE] error:", error);
    return NextResponse.json({ error: "Kayıt silinemedi" }, { status: 500 });
  }
}
