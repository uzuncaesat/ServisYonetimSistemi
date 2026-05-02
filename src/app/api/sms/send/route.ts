import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getOrgId } from "@/lib/api-auth";
import { smsSendSchema } from "@/lib/validations";
import { sendSmsBulk } from "@/lib/sms";

export const runtime = "nodejs";

// POST /api/sms/send
// Body: { recipients: [{ to, aliciAdi? }], message, sender?, tetikleyici? }
export async function POST(req: NextRequest) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const body = await req.json();
    const parsed = smsSendSchema.parse(body);

    const result = await sendSmsBulk({
      recipients: parsed.recipients,
      message: parsed.message,
      sender: parsed.sender,
      tetikleyici: parsed.tetikleyici ?? "MANUAL",
      gonderenId: session!.user.id,
      organizationId: getOrgId(session!) ?? null,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[SMS Send] error:", error);
    if (error && typeof error === "object" && "errors" in error) {
      return NextResponse.json(
        { error: "Geçersiz veri", details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "SMS gönderilemedi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
