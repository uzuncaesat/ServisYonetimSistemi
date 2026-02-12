import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validations";
import { requireAuth, getOrgFilter } from "@/lib/api-auth";

// GET - Tek proje detayı
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        vehicles: {
          include: {
            vehicle: {
              include: {
                supplier: true,
                driver: true,
              },
            },
            vehicleRoutes: {
              include: {
                route: true,
              },
            },
          },
        },
        routes: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Proje bulunamadı" },
        { status: 404 }
      );
    }

    if (session!.user.organizationId && project.organizationId !== session!.user.organizationId) {
      return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Project GET error:", error);
    return NextResponse.json(
      { error: "Proje alınamadı" },
      { status: 500 }
    );
  }
}

// PUT - Proje güncelle
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const existing = await prisma.project.findUnique({ where: { id: params.id } });
    if (existing && session!.user.organizationId && existing.organizationId !== session!.user.organizationId) {
      return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = projectSchema.parse(body);

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ad: validatedData.ad,
        aciklama: validatedData.aciklama,
        baslangicTarihi: validatedData.baslangicTarihi
          ? new Date(validatedData.baslangicTarihi)
          : null,
        bitisTarihi: validatedData.bitisTarihi
          ? new Date(validatedData.bitisTarihi)
          : null,
      },
    });

    return NextResponse.json(project);
  } catch (error: unknown) {
    console.error("Project PUT error:", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Proje bulunamadı" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Proje güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Proje sil
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const existing = await prisma.project.findUnique({ where: { id: params.id } });
    if (existing && session!.user.organizationId && existing.organizationId !== session!.user.organizationId) {
      return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
    }

    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Project DELETE error:", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Proje bulunamadı" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Proje silinemedi" },
      { status: 500 }
    );
  }
}
