import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Güzergaha araç ata
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { projectVehicleId } = body;

    if (!projectVehicleId) {
      return NextResponse.json(
        { error: "ProjectVehicle ID zorunludur" },
        { status: 400 }
      );
    }

    // Check if already assigned
    const existing = await prisma.vehicleRoute.findUnique({
      where: {
        projectVehicleId_routeId: {
          projectVehicleId,
          routeId: params.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu araç zaten güzergaha atanmış" },
        { status: 400 }
      );
    }

    const vehicleRoute = await prisma.vehicleRoute.create({
      data: {
        projectVehicleId,
        routeId: params.id,
      },
      include: {
        projectVehicle: {
          include: {
            vehicle: true,
          },
        },
        route: true,
      },
    });

    return NextResponse.json(vehicleRoute, { status: 201 });
  } catch (error) {
    console.error("Vehicle route POST error:", error);
    return NextResponse.json(
      { error: "Araç güzergaha atanamadı" },
      { status: 500 }
    );
  }
}

// DELETE - Güzergahtan araç kaldır
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleRouteId = searchParams.get("vehicleRouteId");

    if (!vehicleRouteId) {
      return NextResponse.json(
        { error: "VehicleRoute ID zorunludur" },
        { status: 400 }
      );
    }

    await prisma.vehicleRoute.delete({
      where: { id: vehicleRouteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vehicle route DELETE error:", error);
    return NextResponse.json(
      { error: "Araç güzergahtan kaldırılamadı" },
      { status: 500 }
    );
  }
}
