import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { vehicleExpenseSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

async function checkAccess(id: string, sessionOrgId: string | null | undefined) {
  const expense = await prisma.vehicleExpense.findUnique({ where: { id } });
  if (!expense) {
    return { expense: null, response: NextResponse.json({ error: "Gider bulunamadı" }, { status: 404 }) };
  }
  if (sessionOrgId && expense.organizationId !== sessionOrgId) {
    return { expense: null, response: NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 }) };
  }
  return { expense, response: null };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    const { expense, response } = await checkAccess(params.id, session!.user.organizationId);
    if (response) return response;
    return NextResponse.json(expense);
  } catch (error) {
    console.error("[VehicleExpense GET id] error:", error);
    return NextResponse.json({ error: "Gider alınamadı" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    const { response } = await checkAccess(params.id, session!.user.organizationId);
    if (response) return response;

    const body = await req.json();
    const data = vehicleExpenseSchema.parse(body);

    const expense = await prisma.vehicleExpense.update({
      where: { id: params.id },
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
      },
    });

    return NextResponse.json(expense);
  } catch (error: unknown) {
    console.error("[VehicleExpense PUT] error:", error);
    if (error && typeof error === "object" && "errors" in error) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Güncellenemedi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    const { response } = await checkAccess(params.id, session!.user.organizationId);
    if (response) return response;

    await prisma.vehicleExpense.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[VehicleExpense DELETE] error:", error);
    return NextResponse.json({ error: "Gider silinemedi" }, { status: 500 });
  }
}
