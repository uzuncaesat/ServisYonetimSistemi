import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";

const registerSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir email adresi giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit (Upstash varsa - UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "anonymous";
    const rateLimitError = await checkRateLimit(`register:${ip}`);
    if (rateLimitError) return rateLimitError;

    // Kayıt ALLOW_REGISTRATION=false ile kapatılabilir (şirket kullanımı için)
    if (process.env.ALLOW_REGISTRATION === "false") {
      return NextResponse.json(
        { error: "Kayıt şu anda kapalı" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email adresi zaten kullanılıyor" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // E-posta doğrulama kodu
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 dakika

    // Create user with default USER role, email not verified yet
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: "USER",
        emailVerified: false,
        verificationCode,
        verificationExpires,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Doğrulama kodu e-posta gönder
    try {
      await sendEmail({
        to: validatedData.email,
        subject: "[UZHAN ERP] E-posta Doğrulama Kodu",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 20px;">UZHAN ERP</h1>
              <p style="margin: 4px 0 0; opacity: 0.8; font-size: 13px;">E-posta Doğrulama</p>
            </div>
            <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="font-size: 14px; color: #334155;">Merhaba <strong>${validatedData.name}</strong>,</p>
              <p style="font-size: 14px; color: #334155;">Kaydınızı tamamlamak için doğrulama kodunuz:</p>
              <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">${verificationCode}</span>
              </div>
              <p style="font-size: 13px; color: #64748b;">Bu kod 15 dakika içinde geçerliliğini yitirecektir.</p>
            </div>
          </div>
        `,
      });
    } catch {
      // E-posta gönderilmese bile kayıt başarılı
    }

    return NextResponse.json(
      { ...user, requiresVerification: true },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Kayıt işlemi başarısız oldu" },
      { status: 500 }
    );
  }
}
