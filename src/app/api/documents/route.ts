import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getOrgFilter } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

// GET - Evrakları listele
export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const ownerType = searchParams.get("ownerType");
    const ownerId = searchParams.get("ownerId");

    const orgFilter = getOrgFilter(session!);
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

    // Multi-tenant org filter through vehicle or driver
    if (Object.keys(orgFilter).length > 0) {
      where.OR = [
        { vehicle: orgFilter },
        { driver: orgFilter },
      ];
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
