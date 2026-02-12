import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { routeSchema } from "@/lib/validations";
import { requireAuth, requireFactoryPriceEditAuth, getOrgFilter } from "@/lib/api-auth";

// GET - Tüm güzergahları listele (vehicleId verilirse sadece o araca atanmış güzergahlar)
export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const vehicleId = searchParams.get("vehicleId");

    const where: Prisma.RouteWhereInput = projectId ? { projectId } : {};

    // Multi-tenant org filter through project
    where.project = { ...getOrgFilter(session!) };

    // vehicleId verilirse sadece o araca atanmış güzergahları filtrele
    if (projectId && vehicleId) {
      where.vehicleRoutes = {
        some: {
          projectVehicle: {
            projectId,
            vehicleId,
          },
        },
      };
    }

    const routes = await prisma.route.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            id: true,
            ad: true,
          },
        },
        _count: {
          select: {
            vehicleRoutes: true,
            timesheetEntries: true,
          },
        },
      },
    });

    return NextResponse.json(routes);
  } catch (error) {
    console.error("Routes GET error:", error);
    return NextResponse.json(
      { error: "Güzergahlar alınamadı" },
      { status: 500 }
    );
  }
}

// POST - Yeni güzergah ekle
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = routeSchema.parse(body);

    // Fabrika fiyatı sadece ADMIN tarafından set edilebilir
    if (validatedData.fabrikaFiyati != null) {
      const auth = await requireFactoryPriceEditAuth();
      if (auth.error) return auth.error;
    }

    const route = await prisma.route.create({
      data: {
        ad: validatedData.ad,
        baslangicNoktasi: validatedData.baslangicNoktasi,
        bitisNoktasi: validatedData.bitisNoktasi,
        km: validatedData.km,
        birimFiyat: validatedData.birimFiyat,
        fabrikaFiyati: validatedData.fabrikaFiyati || null,
        kdvOrani: validatedData.kdvOrani,
        projectId: validatedData.projectId,
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json(route, { status: 201 });
  } catch (error: unknown) {
    console.error("Routes POST error:", error);
    if (error && typeof error === "object" && "errors" in error) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Güzergah oluşturulamadı" },
      { status: 500 }
    );
  }
}
