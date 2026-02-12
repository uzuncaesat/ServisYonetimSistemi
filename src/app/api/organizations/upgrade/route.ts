export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { PLAN_DEFINITIONS, PlanType } from "@/lib/subscription";

// POST - Plan yükseltme (ödeme onayı sonrası çağrılır)
export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (session!.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sadece admin plan değiştirebilir" }, { status: 403 });
    }

    const orgId = session!.user.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "Organizasyon bulunamadı" }, { status: 400 });
    }

    const { plan } = await req.json();

    if (!plan || !PLAN_DEFINITIONS[plan as PlanType]) {
      return NextResponse.json({ error: "Geçersiz plan" }, { status: 400 });
    }

    const planDef = PLAN_DEFINITIONS[plan as PlanType];

    const org = await prisma.organization.update({
      where: { id: orgId },
      data: {
        plan,
        maxVehicles: planDef.limits.maxVehicles,
        trialEndsAt: null, // Ücretli plana geçince deneme süresi kaldır
      },
    });

    return NextResponse.json({
      success: true,
      organization: {
        id: org.id,
        plan: org.plan,
        maxVehicles: org.maxVehicles,
      },
    });
  } catch (error) {
    console.error("Plan upgrade error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
