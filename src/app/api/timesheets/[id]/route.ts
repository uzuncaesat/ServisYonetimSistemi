import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Tek puantaj detayı
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const timesheet = await prisma.timesheet.findUnique({
      where: { id: params.id },
      include: {
        project: true,
        vehicle: {
          include: {
            supplier: true,
            driver: true,
          },
        },
        entries: {
          include: {
            route: true,
          },
          orderBy: [{ tarih: "asc" }, { routeId: "asc" }],
        },
      },
    });

    if (!timesheet) {
      return NextResponse.json(
        { error: "Puantaj bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json(timesheet);
  } catch (error) {
    console.error("Timesheet GET error:", error);
    return NextResponse.json(
      { error: "Puantaj alınamadı" },
      { status: 500 }
    );
  }
}

// DELETE - Puantaj sil
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.timesheet.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Timesheet DELETE error:", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json(
        { error: "Puantaj bulunamadı" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Puantaj silinemedi" },
      { status: 500 }
    );
  }
}
