import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAdminAuth, getOrgFilter, getOrgId } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["USER", "MANAGER", "ADMIN"] as const;

const createUserSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  role: z.enum(ALLOWED_ROLES, {
    errorMap: () => ({ message: "Geçersiz rol. USER, MANAGER veya ADMIN olmalı." }),
  }),
});

// GET - Tüm kullanıcıları listele (sadece ADMIN)
export async function GET() {
  try {
    const auth = await requireAdminAuth();
    if (auth.error) return auth.error;

    const users = await prisma.user.findMany({
      where: getOrgFilter(auth.session!),
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Users GET error:", error);
    return NextResponse.json(
      { error: "Kullanıcılar alınamadı" },
      { status: 500 }
    );
  }
}

// POST - Yeni kullanıcı oluştur (sadece ADMIN)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminAuth();
    if (auth.error) return auth.error;

    let organizationId: string | undefined;
    try {
      organizationId = getOrgId(auth.session!) ?? undefined;
    } catch {
      organizationId = undefined;
    }
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organizasyon kaydı bulunamadı. Sistem yöneticisi ile iletişime geçin." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = createUserSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kullanılıyor" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        emailVerified: true,
        organizationId,
      },
      select: {
        id: true,
        email: true,
        name: true,
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
    console.error("Users POST error:", error);
    return NextResponse.json(
      { error: "Kullanıcı oluşturulamadı" },
      { status: 500 }
    );
  }
}
