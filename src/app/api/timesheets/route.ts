import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { timesheetSchema } from "@/lib/validations";
import { requireAuth, getOrgFilter } from "@/lib/api-auth";

// GET - Tüm puantajları listele
export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const vehicleId = searchParams.get("vehicleId");
    const yil = searchParams.get("yil");
    const ay = searchParams.get("ay");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (vehicleId) where.vehicleId = vehicleId;
    if (yil) where.yil = parseInt(yil);
    if (ay) where.ay = parseInt(ay);

    // Multi-tenant org filter through project
    where.project = { ...getOrgFilter(session!) };

    const timesheets = await prisma.timesheet.findMany({
      where,
      orderBy: [{ yil: "desc" }, { ay: "desc" }],
      include: {
        project: {
          select: { id: true, ad: true },
        },
        vehicle: {
          select: {
            id: true,
            plaka: true,
            supplier: { select: { id: true, firmaAdi: true } },
          },
        },
        entries: {
          include: {
            route: { select: { id: true, ad: true } },
          },
        },
      },
    });

    return NextResponse.json(timesheets);
  } catch (error) {
    console.error("Timesheets GET error:", error);
    return NextResponse.json(
      { error: "Puantajlar alınamadı" },
      { status: 500 }
    );
  }
}

// POST - Yeni puantaj oluştur veya mevcut olanı getir
export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const validatedData = timesheetSchema.parse(body);

    // Check if timesheet already exists
    let timesheet = await prisma.timesheet.findUnique({
      where: {
        projectId_vehicleId_yil_ay: {
          projectId: validatedData.projectId,
          vehicleId: validatedData.vehicleId,
          yil: validatedData.yil,
          ay: validatedData.ay,
        },
      },
      include: {
        project: true,
        vehicle: {
          include: { supplier: true },
        },
        entries: {
          include: { route: true },
        },
      },
    });

    if (!timesheet) {
      // Create new timesheet
      timesheet = await prisma.timesheet.create({
        data: {
          projectId: validatedData.projectId,
          vehicleId: validatedData.vehicleId,
          yil: validatedData.yil,
          ay: validatedData.ay,
        },
        include: {
          project: true,
          vehicle: {
            include: { supplier: true },
          },
          entries: {
            include: { route: true },
          },
        },
      });
    }

    return NextResponse.json(timesheet, { status: 201 });
  } catch (error: unknown) {
    console.error("Timesheets POST error:", error);
    if (error && typeof error === "object" && "errors" in error) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Puantaj oluşturulamadı" },
      { status: 500 }
    );
  }
}
