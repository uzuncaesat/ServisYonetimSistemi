import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = verifySchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        emailVerified: true,
        verificationCode: true,
        verificationExpires: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    if (!user.verificationCode || !user.verificationExpires) {
      return NextResponse.json(
        { error: "Doğrulama kodu bulunamadı" },
        { status: 400 }
      );
    }

    if (new Date() > user.verificationExpires) {
      return NextResponse.json(
        { error: "Doğrulama kodunun süresi dolmuş. Yeni kod talep edin." },
        { status: 400 }
      );
    }

    if (user.verificationCode !== code) {
      return NextResponse.json(
        { error: "Geçersiz doğrulama kodu" },
        { status: 400 }
      );
    }

    // E-posta doğrulandı
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationExpires: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Verify error:", error);
    return NextResponse.json(
      { error: "Doğrulama başarısız" },
      { status: 500 }
    );
  }
}
