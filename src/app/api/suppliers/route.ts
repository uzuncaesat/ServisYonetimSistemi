import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supplierSchema } from "@/lib/validations";

// GET - Tüm tedarikçileri listele
export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { vehicles: true },
        },
      },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Suppliers GET error:", error);
    return NextResponse.json(
      { error: "Tedarikçiler alınamadı" },
      { status: 500 }
    );
  }
}

// POST - Yeni tedarikçi ekle
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = supplierSchema.parse(body);

    const supplier = await prisma.supplier.create({
      data: validatedData,
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error: unknown) {
    console.error("Suppliers POST error:", error);
    if (error && typeof error === "object" && "errors" in error) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Tedarikçi oluşturulamadı" },
      { status: 500 }
    );
  }
}
