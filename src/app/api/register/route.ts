import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";

const registerSchema = z.object({
  // Firma bilgileri
  companyName: z.string().min(2, "Firma adı en az 2 karakter olmalıdır"),
  slug: z.string().min(2, "URL kısaltması en az 2 karakter olmalıdır")
    .regex(/^[a-z0-9-]+$/, "Sadece küçük harf, rakam ve tire kullanılabilir"),
  // Kullanıcı bilgileri
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir email adresi giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "anonymous";
    const rateLimitError = await checkRateLimit(`org-register:${ip}`);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const data = registerSchema.parse(body);

    // Email zaten kullanılıyor mu?
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email adresi zaten kullanılıyor" },
        { status: 400 }
      );
    }

    // Slug benzersiz mi?
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: data.slug },
    });
    if (existingOrg) {
      return NextResponse.json(
        { error: "Bu URL kısaltması zaten kullanılıyor. Farklı bir kısaltma deneyin." },
        { status: 400 }
      );
    }

    // E-posta doğrulama kodu oluştur
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 dakika

    // Transaction: Organizasyon + Admin kullanıcı oluştur
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // Organizasyon oluştur
      const org = await tx.organization.create({
        data: {
          name: data.companyName,
          slug: data.slug,
          plan: "free",
          isActive: true,
          maxVehicles: 10,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 gün deneme
        },
      });

      // Admin kullanıcı oluştur
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: "ADMIN",
          organizationId: org.id,
          emailVerified: false,
          verificationCode,
          verificationExpires,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      // Varsayılan ayarları oluştur
      await tx.setting.create({
        data: {
          key: "default_report_price_type",
          value: "supplier",
          organizationId: org.id,
        },
      });

      return { org, user };
    });

    // Doğrulama kodu e-posta gönder
    try {
      await sendEmail({
        to: data.email,
        subject: "[UZHAN ERP] E-posta Doğrulama Kodu",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 20px;">UZHAN ERP</h1>
              <p style="margin: 4px 0 0; opacity: 0.8; font-size: 13px;">E-posta Doğrulama</p>
            </div>
            <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="font-size: 14px; color: #334155;">Merhaba <strong>${data.name}</strong>,</p>
              <p style="font-size: 14px; color: #334155;">
                <strong>${data.companyName}</strong> için kaydınızı tamamlamak üzere doğrulama kodunuz:
              </p>
              <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">
                  ${verificationCode}
                </span>
              </div>
              <p style="font-size: 13px; color: #64748b;">
                Bu kod 15 dakika içinde geçerliliğini yitirecektir.
              </p>
            </div>
          </div>
        `,
      });
    } catch {
      // E-posta gönderilmese bile kayıt başarılı
    }

    return NextResponse.json(
      {
        success: true,
        user: result.user,
        organization: { id: result.org.id, name: result.org.name, slug: result.org.slug },
        requiresVerification: true,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Organization register error:", error);
    return NextResponse.json(
      { error: "Kayıt işlemi başarısız oldu" },
      { status: 500 }
    );
  }
}
