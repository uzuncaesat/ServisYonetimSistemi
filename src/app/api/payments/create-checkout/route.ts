export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { PLAN_DEFINITIONS, PlanType } from "@/lib/subscription";

/**
 * Stripe Checkout Session oluştur
 * 
 * Kurulum:
 * 1. stripe.com'dan hesap aç
 * 2. Stripe Dashboard'dan recurring price'lar oluştur
 * 3. .env'ye ekle:
 *    STRIPE_SECRET_KEY=sk_xxx
 *    STRIPE_WEBHOOK_SECRET=whsec_xxx
 *    STRIPE_STARTER_PRICE_ID=price_xxx
 *    STRIPE_PRO_PRICE_ID=price_xxx
 *    NEXT_PUBLIC_APP_URL=https://uzhanerp.com
 */

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (session!.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sadece admin ödeme yapabilir" }, { status: 403 });
    }

    const orgId = session!.user.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "Organizasyon bulunamadı" }, { status: 400 });
    }

    const { plan } = await req.json();

    if (!plan || !["starter", "pro"].includes(plan)) {
      return NextResponse.json({ error: "Geçersiz plan" }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      // Stripe yoksa doğrudan plan yükselt (test modu)
      const planDef = PLAN_DEFINITIONS[plan as PlanType];
      await prisma.organization.update({
        where: { id: orgId },
        data: {
          plan,
          maxVehicles: planDef.limits.maxVehicles,
          trialEndsAt: null,
        },
      });
      return NextResponse.json({
        success: true,
        mode: "direct",
        message: "Plan güncellendi (Stripe yapılandırılmamış - doğrudan güncelleme)",
      });
    }

    // Stripe price ID'leri
    const priceIds: Record<string, string | undefined> = {
      starter: process.env.STRIPE_STARTER_PRICE_ID,
      pro: process.env.STRIPE_PRO_PRICE_ID,
    };

    const priceId = priceIds[plan];
    if (!priceId) {
      return NextResponse.json({ error: "Bu plan için fiyat tanımlı değil" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://uzhanerp.com";

    // Stripe Checkout Session oluştur
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "mode": "subscription",
        "payment_method_types[0]": "card",
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        "success_url": `${appUrl}/ayarlar/abonelik?success=true`,
        "cancel_url": `${appUrl}/ayarlar/abonelik?cancelled=true`,
        "metadata[organizationId]": orgId,
        "metadata[plan]": plan,
        "customer_email": session!.user.email,
      }),
    });

    const checkoutSession = await response.json();

    if (!response.ok) {
      console.error("Stripe error:", checkoutSession);
      return NextResponse.json({ error: "Ödeme oturumu oluşturulamadı" }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Payment checkout error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
