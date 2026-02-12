import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "anonymous";
    const rateLimitError = await checkRateLimit(`resend-code:${ip}`);
    if (rateLimitError) return rateLimitError;

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email gerekli" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationCode, verificationExpires },
    });

    await sendEmail({
      to: email,
      subject: "[UZHAN ERP] Yeni Doğrulama Kodu",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">UZHAN ERP</h1>
          </div>
          <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px; text-align: center;">
            <p>Merhaba <strong>${user.name}</strong>,</p>
            <p>Yeni doğrulama kodunuz:</p>
            <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${verificationCode}</span>
            </div>
            <p style="font-size: 13px; color: #64748b;">Bu kod 15 dakika geçerlidir.</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend code error:", error);
    return NextResponse.json({ error: "Kod gönderilemedi" }, { status: 500 });
  }
}
