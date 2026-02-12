import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { driverSchema } from "@/lib/validations";
import { requireAuth, getOrgFilter, getOrgId } from "@/lib/api-auth";

// GET - Tüm şoförleri listele
export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const drivers = await prisma.driver.findMany({
      where: { ...getOrgFilter(session!) },
      orderBy: { createdAt: "desc" },
      include: {
        vehicle: {
          select: {
            id: true,
            plaka: true,
          },
        },
        _count: {
          select: { documents: true },
        },
      },
    });

    return NextResponse.json(drivers);
  } catch (error) {
    console.error("Drivers GET error:", error);
    return NextResponse.json(
      { error: "Şoförler alınamadı" },
      { status: 500 }
    );
  }
}

// POST - Yeni şoför ekle
export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const validatedData = driverSchema.parse(body);

    const driver = await prisma.driver.create({
      data: { ...validatedData, organizationId: getOrgId(session!) },
    });

    return NextResponse.json(driver, { status: 201 });
  } catch (error: unknown) {
    console.error("Drivers POST error:", error);
    if (error && typeof error === "object" && "errors" in error) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Şoför oluşturulamadı" },
      { status: 500 }
    );
  }
}
