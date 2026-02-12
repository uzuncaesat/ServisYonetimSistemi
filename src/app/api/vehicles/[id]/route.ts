import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { vehicleSchema } from "@/lib/validations";
import { requireAuth, getOrgFilter } from "@/lib/api-auth";

// GET - Tek araç detayı
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        driver: true,
        projects: {
          include: {
            project: true,
            vehicleRoutes: {
              include: {
                route: true,
              },
            },
          },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        timesheets: {
          orderBy: [{ yil: "desc" }, { ay: "desc" }],
          take: 5,
          include: {
            project: true,
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Araç bulunamadı" },
        { status: 404 }
      );
    }

    if (session!.user.organizationId && vehicle.organizationId !== session!.user.organizationId) {
      return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("Vehicle GET error:", error);
    return NextResponse.json(
      { error: "Araç alınamadı" },
      { status: 500 }
    );
  }
}

// PUT - Araç güncelle
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const existingForOrg = await prisma.vehicle.findUnique({ where: { id: params.id } });
    if (existingForOrg && session!.user.organizationId && existingForOrg.organizationId !== session!.user.organizationId) {
      return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = vehicleSchema.parse(body);

    // Check if plaka already exists for another vehicle
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        plaka: validatedData.plaka,
        NOT: { id: params.id },
      },
    });

    if (existingVehicle) {
      return NextResponse.json(
        { error: "Bu plaka başka bir araçta kayıtlı" },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: params.id },
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

    return NextResponse.json(vehicle);
  } catch (error: unknown) {
    console.error("Vehicle PUT error:", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Araç bulunamadı" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Araç güncellenemedi" },
      { status: 500 }
    );
  }
}

// PATCH - Sadece driverId güncelle (şoför atama)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const existingForOrg = await prisma.vehicle.findUnique({ where: { id: params.id } });
    if (existingForOrg && session!.user.organizationId && existingForOrg.organizationId !== session!.user.organizationId) {
      return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
    }

    const body = await req.json();
    const { driverId } = body;

    const vehicle = await prisma.vehicle.update({
      where: { id: params.id },
      data: { driverId: driverId || null },
      include: {
        supplier: true,
        driver: true,
      },
    });

    return NextResponse.json(vehicle);
  } catch (error: unknown) {
    console.error("Vehicle PATCH error:", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Araç bulunamadı" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Şoför ataması yapılamadı" },
      { status: 500 }
    );
  }
}

// DELETE - Araç sil
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const existingForOrg = await prisma.vehicle.findUnique({ where: { id: params.id } });
    if (existingForOrg && session!.user.organizationId && existingForOrg.organizationId !== session!.user.organizationId) {
      return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
    }

    await prisma.vehicle.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Vehicle DELETE error:", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Araç bulunamadı" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Araç silinemedi" },
      { status: 500 }
    );
  }
}
