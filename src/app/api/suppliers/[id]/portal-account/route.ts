export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST - Tedarikçi için portal hesabı oluştur
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error } = await requireAdminAuth();
    if (error) return error;

    const supplierId = params.id;
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email ve şifre gereklidir" },
        { status: 400 }
      );
    }

    // Tedarikçi var mı kontrol
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Tedarikçi bulunamadı" },
        { status: 404 }
      );
    }

    // Bu tedarikçi için zaten portal hesabı var mı?
    const existingUser = await prisma.user.findFirst({
      where: { supplierId },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu tedarikçi için zaten bir portal hesabı mevcut", existingEmail: existingUser.email },
        { status: 409 }
      );
    }

    // Email zaten kullanılıyor mu?
    const emailInUse = await prisma.user.findUnique({
      where: { email },
    });

    if (emailInUse) {
      return NextResponse.json(
        { error: "Bu email adresi zaten kullanılıyor" },
        { status: 409 }
      );
    }

    // Şifreyi hashle ve kullanıcı oluştur
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || supplier.firmaAdi,
        role: "SUPPLIER",
        supplierId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Portal account creation error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
