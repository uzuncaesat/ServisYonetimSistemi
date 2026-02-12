import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validations";
import { requireAuth, getOrgFilter, getOrgId } from "@/lib/api-auth";

// GET - Tüm projeleri listele
export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const projects = await prisma.project.findMany({
      where: { ...getOrgFilter(session!) },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            vehicles: true,
            routes: true,
            timesheets: true,
          },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Projects GET error:", error);
    return NextResponse.json(
      { error: "Projeler alınamadı" },
      { status: 500 }
    );
  }
}

// POST - Yeni proje ekle
export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const validatedData = projectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        ad: validatedData.ad,
        aciklama: validatedData.aciklama,
        baslangicTarihi: validatedData.baslangicTarihi
          ? new Date(validatedData.baslangicTarihi)
          : null,
        bitisTarihi: validatedData.bitisTarihi
          ? new Date(validatedData.bitisTarihi)
          : null,
        organizationId: getOrgId(session!),
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: unknown) {
    console.error("Projects POST error:", error);
    if (error && typeof error === "object" && "errors" in error) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Proje oluşturulamadı" },
      { status: 500 }
    );
  }
}
