import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

// GET - Tüm kullanıcıları listele (sadece ADMIN)
export async function GET() {
  try {
    const auth = await requireAdminAuth();
    if (auth.error) return auth.error;

    const users = await prisma.user.findMany({
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
