import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Evrakları listele
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerType = searchParams.get("ownerType");
    const ownerId = searchParams.get("ownerId");

    const where: Record<string, unknown> = {};
    if (ownerType) {
      where.ownerType = ownerType;
    }
    if (ownerId) {
      if (ownerType === "VEHICLE") {
        where.vehicleId = ownerId;
      } else if (ownerType === "DRIVER") {
        where.driverId = ownerId;
      }
    }

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Documents GET error:", error);
    return NextResponse.json(
      { error: "Evraklar alınamadı" },
      { status: 500 }
    );
  }
}
