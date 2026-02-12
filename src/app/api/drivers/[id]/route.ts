import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { driverSchema } from "@/lib/validations";
import { requireAuth, getOrgFilter } from "@/lib/api-auth";

// GET - Tek şoför detayı
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const driver = await prisma.driver.findUnique({
      where: { id: params.id },
      include: {
        vehicle: {
          include: {
            supplier: true,
          },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!driver) {
      return NextResponse.json(
        { error: "Şoför bulunamadı" },
        { status: 404 }
      );
    }

    if (session!.user.organizationId && driver.organizationId !== session!.user.organizationId) {
      return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
    }

    return NextResponse.json(driver);
  } catch (error) {
    console.error("Driver GET error:", error);
    return NextResponse.json(
      { error: "Şoför alınamadı" },
      { status: 500 }
    );
  }
}

// PUT - Şoför güncelle
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const existing = await prisma.driver.findUnique({ where: { id: params.id } });
    if (existing && session!.user.organizationId && existing.organizationId !== session!.user.organizationId) {
      return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = driverSchema.parse(body);

    const driver = await prisma.driver.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(driver);
  } catch (error: unknown) {
    console.error("Driver PUT error:", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Şoför bulunamadı" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Şoför güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Şoför sil
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const existing = await prisma.driver.findUnique({ where: { id: params.id } });
    if (existing && session!.user.organizationId && existing.organizationId !== session!.user.organizationId) {
      return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
    }

    await prisma.driver.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Driver DELETE error:", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Şoför bulunamadı" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Şoför silinemedi" },
      { status: 500 }
    );
  }
}
