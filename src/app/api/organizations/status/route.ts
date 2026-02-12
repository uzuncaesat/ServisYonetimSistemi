export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { checkOrganizationStatus, PLAN_DEFINITIONS, PlanType } from "@/lib/subscription";

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const orgId = session!.user.organizationId;
    if (!orgId) {
      return NextResponse.json({
        isActive: true,
        isTrialExpired: false,
        plan: "enterprise",
        daysRemaining: null,
        planDetails: PLAN_DEFINITIONS.enterprise,
      });
    }

    const status = await checkOrganizationStatus(orgId);
    const planDetails = PLAN_DEFINITIONS[status.plan as PlanType] || PLAN_DEFINITIONS.free;

    return NextResponse.json({
      ...status,
      planDetails,
    });
  } catch (error) {
    console.error("Org status error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
