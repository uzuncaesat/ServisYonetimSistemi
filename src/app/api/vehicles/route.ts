import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validations";

// GET - Tüm araçları listele
export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        supplier: {
          select: {
            id: true,
            firmaAdi: true,
          },
        },
        driver: {
          select: {
            id: true,
            adSoyad: true,
          },
        },
        _count: {
          select: {
            projects: true,
            documents: true,
          },
        },
      },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("Vehicles GET error:", error);
    return NextResponse.json(
      { error: "Araçlar alınamadı" },
      { status: 500 }
    );
  }
}

// POST - Yeni araç ekle
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = vehicleSchema.parse(body);

    // Check if plaka already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plaka: validatedData.plaka },
    });

    if (existingVehicle) {
      return NextResponse.json(
        { error: "Bu plaka zaten kayıtlı" },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        plaka: validatedData.plaka,
        marka: validatedData.marka,
        model: validatedData.model,
        kisiSayisi: validatedData.kisiSayisi,
        supplierId: validatedData.supplierId,
        driverId: validatedData.driverId || null,
      },
      include: {
        supplier: true,
        driver: true,
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error: unknown) {
    console.error("Vehicles POST error:", error);
    if (error && typeof error === "object" && "errors" in error) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Araç oluşturulamadı" },
      { status: 500 }
    );
  }
}
