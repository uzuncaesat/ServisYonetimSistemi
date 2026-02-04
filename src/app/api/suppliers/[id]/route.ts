import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supplierSchema } from "@/lib/validations";

// GET - Tek tedarikçi detayı
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        vehicles: {
          include: {
            driver: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Tedarikçi bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Supplier GET error:", error);
    return NextResponse.json(
      { error: "Tedarikçi alınamadı" },
      { status: 500 }
    );
  }
}

// PUT - Tedarikçi güncelle
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validatedData = supplierSchema.parse(body);

    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(supplier);
  } catch (error: unknown) {
    console.error("Supplier PUT error:", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Tedarikçi bulunamadı" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Tedarikçi güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Tedarikçi sil
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.supplier.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Supplier DELETE error:", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Tedarikçi bulunamadı" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Tedarikçi silinemedi" },
      { status: 500 }
    );
  }
}
