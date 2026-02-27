import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extraWorkSchema } from "@/lib/validations/extra-work";
import { requireAuth, requireFactoryPriceEditAuth, getOrgFilter } from "@/lib/api-auth";

// GET - List all extra work entries (with filters)
export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get("supplierId");
    const yil = searchParams.get("yil");
    const ay = searchParams.get("ay");

    const where: {
      supplierId?: string;
      tarih?: { gte: Date; lt: Date };
      project?: Record<string, unknown>;
    } = {};

    // Multi-tenant org filter through project
    where.project = { ...getOrgFilter(session!) };

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (yil && ay) {
      const startDate = new Date(parseInt(yil), parseInt(ay) - 1, 1);
      const endDate = new Date(parseInt(yil), parseInt(ay), 1);
      where.tarih = {
        gte: startDate,
        lt: endDate,
      };
    }

    const extraWorks = await prisma.extraWork.findMany({
      where,
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
      orderBy: { tarih: "desc" },
    });

    return NextResponse.json(extraWorks);
  } catch (error) {
    console.error("Extra work list error:", error);
    return NextResponse.json(
      { error: "Ek işler yüklenemedi" },
      { status: 500 }
    );
  }
}

// POST - Create new extra work entry
export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const validated = extraWorkSchema.parse(body);

    if (validated.fabrikaFiyati != null) {
      const auth = await requireFactoryPriceEditAuth();
      if (auth.error) return auth.error;
    }

    const isAdmin = session!.user.role === "ADMIN";
    const extraWork = await prisma.extraWork.create({
      data: {
        tarih: new Date(validated.tarih),
        aciklama: validated.aciklama,
        fiyat: validated.fiyat,
        fabrikaFiyati: validated.fabrikaFiyati || null,
        supplierId: validated.supplierId,
        vehicleId: validated.vehicleId,
        projectId: validated.projectId,
        status: isAdmin ? "APPROVED" : "PENDING_APPROVAL",
        approvedById: isAdmin ? session!.user.id : null,
        approvedAt: isAdmin ? new Date() : null,
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

    return NextResponse.json(extraWork, { status: 201 });
  } catch (error) {
    console.error("Extra work create error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Geçersiz veri" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Ek iş oluşturulamadı" },
      { status: 500 }
    );
  }
}
