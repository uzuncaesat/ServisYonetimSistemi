import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extraWorkSchema } from "@/lib/validations/extra-work";

// GET - Get single extra work entry
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const extraWork = await prisma.extraWork.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        vehicle: true,
        project: true,
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

// PUT - Update extra work entry
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = extraWorkSchema.parse(body);

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
