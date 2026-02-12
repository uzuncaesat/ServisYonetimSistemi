export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLAN_DEFINITIONS, PlanType } from "@/lib/subscription";
import { headers } from "next/headers";
import crypto from "crypto";

/**
 * Stripe Webhook handler
 * Stripe Dashboard'dan webhook endpoint olarak bu URL'yi ekle:
 * https://yourdomain.com/api/payments/webhook
 * 
 * Events: checkout.session.completed, customer.subscription.deleted
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Webhook secret varsa imza doğrulaması yap
    if (webhookSecret) {
      const signature = headers().get("stripe-signature");
      if (!signature) {
        return NextResponse.json({ error: "İmza yok" }, { status: 400 });
      }

      // Basit timestamp + signature doğrulaması
      const elements = signature.split(",");
      const timestampStr = elements.find((e) => e.startsWith("t="))?.split("=")[1];
      const signatureStr = elements.find((e) => e.startsWith("v1="))?.split("=")[1];

      if (!timestampStr || !signatureStr) {
        return NextResponse.json({ error: "Geçersiz imza formatı" }, { status: 400 });
      }

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(`${timestampStr}.${body}`)
        .digest("hex");

      if (signatureStr !== expectedSignature) {
        return NextResponse.json({ error: "İmza doğrulaması başarısız" }, { status: 400 });
      }
    }

    const event = JSON.parse(body);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const organizationId = session.metadata?.organizationId;
        const plan = session.metadata?.plan;

        if (organizationId && plan) {
          const planDef = PLAN_DEFINITIONS[plan as PlanType];
          if (planDef) {
            await prisma.organization.update({
              where: { id: organizationId },
              data: {
                plan,
                maxVehicles: planDef.limits.maxVehicles,
                trialEndsAt: null,
                isActive: true,
              },
            });
            console.log(`Organization ${organizationId} upgraded to ${plan}`);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        // Abonelik iptal edildiğinde free plana düşür
        const subscription = event.data.object;
        const organizationId = subscription.metadata?.organizationId;

        if (organizationId) {
          await prisma.organization.update({
            where: { id: organizationId },
            data: {
              plan: "free",
              maxVehicles: PLAN_DEFINITIONS.free.limits.maxVehicles,
            },
          });
          console.log(`Organization ${organizationId} downgraded to free (subscription cancelled)`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook işleme hatası" }, { status: 500 });
  }
}
