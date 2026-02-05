import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

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

    // Create user with default USER role
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: "USER", // Default role for new registrations
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
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
