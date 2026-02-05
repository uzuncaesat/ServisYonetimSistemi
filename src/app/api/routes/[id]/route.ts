import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { routeSchema } from "@/lib/validations";
import { requireFactoryPriceEditAuth } from "@/lib/api-auth";

// GET - Tek güzergah detayı
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const route = await prisma.route.findUnique({
      where: { id: params.id },
      include: {
        project: true,
        vehicleRoutes: {
          include: {
            projectVehicle: {
              include: {
                vehicle: {
                  include: {
                    supplier: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!route) {
      return NextResponse.json(
        { error: "Güzergah bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json(route);
  } catch (error) {
    console.error("Route GET error:", error);
    return NextResponse.json(
      { error: "Güzergah alınamadı" },
      { status: 500 }
    );
  }
}

// PUT - Güzergah güncelle
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validatedData = routeSchema.parse(body);

    // Fabrika fiyatı sadece ADMIN tarafından set edilebilir
    if (validatedData.fabrikaFiyati != null) {
      const auth = await requireFactoryPriceEditAuth();
      if (auth.error) return auth.error;
    }

    const route = await prisma.route.update({
      where: { id: params.id },
      data: {
        ad: validatedData.ad,
        baslangicNoktasi: validatedData.baslangicNoktasi,
        bitisNoktasi: validatedData.bitisNoktasi,
        km: validatedData.km,
        birimFiyat: validatedData.birimFiyat,
        fabrikaFiyati: validatedData.fabrikaFiyati || null,
        kdvOrani: validatedData.kdvOrani,
      },
    });

    return NextResponse.json(route);
  } catch (error: unknown) {
    console.error("Route PUT error:", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Güzergah bulunamadı" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Güzergah güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Güzergah sil
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.route.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Route DELETE error:", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Güzergah bulunamadı" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Güzergah silinemedi" },
      { status: 500 }
    );
  }
}
