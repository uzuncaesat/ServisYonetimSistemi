import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Projedeki araçları listele
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectVehicles = await prisma.projectVehicle.findMany({
      where: { projectId: params.id },
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
    });

    return NextResponse.json(projectVehicles);
  } catch (error) {
    console.error("Project vehicles GET error:", error);
    return NextResponse.json(
      { error: "Araçlar alınamadı" },
      { status: 500 }
    );
  }
}

// POST - Projeye araç ata
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { vehicleId } = body;

    if (!vehicleId) {
      return NextResponse.json(
        { error: "Araç ID zorunludur" },
        { status: 400 }
      );
    }

    // Check if already assigned
    const existing = await prisma.projectVehicle.findUnique({
      where: {
        projectId_vehicleId: {
          projectId: params.id,
          vehicleId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu araç zaten projeye atanmış" },
        { status: 400 }
      );
    }

    const projectVehicle = await prisma.projectVehicle.create({
      data: {
        projectId: params.id,
        vehicleId,
      },
      include: {
        vehicle: {
          include: {
            supplier: true,
            driver: true,
          },
        },
      },
    });

    return NextResponse.json(projectVehicle, { status: 201 });
  } catch (error) {
    console.error("Project vehicle POST error:", error);
    return NextResponse.json(
      { error: "Araç projeye atanamadı" },
      { status: 500 }
    );
  }
}

// DELETE - Projeden araç kaldır
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectVehicleId = searchParams.get("projectVehicleId");

    if (!projectVehicleId) {
      return NextResponse.json(
        { error: "ProjectVehicle ID zorunludur" },
        { status: 400 }
      );
    }

    await prisma.projectVehicle.delete({
      where: { id: projectVehicleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project vehicle DELETE error:", error);
    return NextResponse.json(
      { error: "Araç projeden kaldırılamadı" },
      { status: 500 }
    );
  }
}
