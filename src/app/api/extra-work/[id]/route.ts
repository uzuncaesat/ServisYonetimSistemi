import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extraWorkSchema } from "@/lib/validations/extra-work";
import { requireAuth, requireFactoryPriceEditAuth, getOrgFilter } from "@/lib/api-auth";

// GET - Get single extra work entry
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const extraWork = await prisma.extraWork.findFirst({
      where: { id: params.id, project: { ...getOrgFilter(session!) } },
      include: {
        supplier: true,
        vehicle: true,
        project: true,
        approvedBy: { select: { id: true, name: true } },
      },
    });

    if (!extraWork) {
      return NextResponse.json(
        { error: "Ek iş bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json(extraWork);
  } catch (error) {
    console.error("Extra work get error:", error);
    return NextResponse.json(
      { error: "Ek iş yüklenemedi" },
      { status: 500 }
    );
  }
}

// PATCH - Approve extra work (Admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    if (session!.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Sadece Admin ek iş onaylayabilir" },
        { status: 403 }
      );
    }

    const existing = await prisma.extraWork.findFirst({
      where: { id: params.id, project: { ...getOrgFilter(session!) } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Ek iş bulunamadı" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const status = body?.status;
    if (status !== "APPROVED") {
      return NextResponse.json(
        { error: "Geçersiz istek" },
        { status: 400 }
      );
    }

    const extraWork = await prisma.extraWork.update({
      where: { id: params.id },
      data: {
        status: "APPROVED",
        approvedById: session!.user.id,
        approvedAt: new Date(),
      },
      include: {
        supplier: { select: { id: true, firmaAdi: true } },
        vehicle: { select: { id: true, plaka: true } },
        project: { select: { id: true, ad: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(extraWork);
  } catch (error) {
    console.error("Extra work approve error:", error);
    return NextResponse.json(
      { error: "Onay işlemi başarısız" },
      { status: 500 }
    );
  }
}

// PUT - Update extra work entry
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    // Verify the extra work belongs to the user's org
    const existing = await prisma.extraWork.findFirst({
      where: { id: params.id, project: { ...getOrgFilter(session!) } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Ek iş bulunamadı" },
        { status: 404 }
      );
    }

    // Projeci can only edit when status is PENDING_APPROVAL
    if (session!.user.role !== "ADMIN" && existing.status === "APPROVED") {
      return NextResponse.json(
        { error: "Onaylanmış ek iş düzenlenemez" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = extraWorkSchema.parse(body);

    if (validated.fabrikaFiyati != null) {
      const auth = await requireFactoryPriceEditAuth();
      if (auth.error) return auth.error;
    }

    const extraWork = await prisma.extraWork.update({
      where: { id: params.id },
      data: {
        tarih: new Date(validated.tarih),
        aciklama: validated.aciklama,
        fiyat: validated.fiyat,
        fabrikaFiyati: validated.fabrikaFiyati || null,
        supplierId: validated.supplierId,
        vehicleId: validated.vehicleId,
        projectId: validated.projectId,
      },
      include: {
        supplier: {
          select: { id: true, firmaAdi: true },
        },
        vehicle: {
          select: { id: true, plaka: true },
        },
        project: {
          select: { id: true, ad: true },
        },
        approvedBy: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(extraWork);
  } catch (error) {
    console.error("Extra work update error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Geçersiz veri" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Ek iş güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Delete extra work entry
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    // Verify the extra work belongs to the user's org
    const existing = await prisma.extraWork.findFirst({
      where: { id: params.id, project: { ...getOrgFilter(session!) } },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Ek iş bulunamadı" },
        { status: 404 }
      );
    }

    await prisma.extraWork.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Extra work delete error:", error);
    return NextResponse.json(
      { error: "Ek iş silinemedi" },
      { status: 500 }
    );
  }
}
