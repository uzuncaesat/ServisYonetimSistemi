export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET - Tüm organizasyonları listele (sadece super admin)
export async function GET() {
  try {
    const { session, error } = await requireAdminAuth();
    if (error) return error;

    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            users: true,
            vehicles: true,
            projects: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error("Organizations GET error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST - Yeni organizasyon oluştur
export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAdminAuth();
    if (error) return error;

    const body = await req.json();
    const { name, slug, plan, maxVehicles } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Firma adı ve slug zorunludur" },
        { status: 400 }
      );
    }

    // Slug benzersiz mi kontrol
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: "Bu slug zaten kullanılıyor" },
        { status: 409 }
      );
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
        plan: plan || "starter",
        maxVehicles: maxVehicles || 10,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 gün deneme
      },
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error("Organization POST error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
