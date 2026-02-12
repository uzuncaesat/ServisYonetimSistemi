import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["USER", "MANAGER", "ADMIN"] as const;

// PATCH - Kullanıcı rolünü güncelle (sadece ADMIN)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminAuth();
    if (auth.error) return auth.error;

    const id = params.id;
    const body = await req.json();
    const { role } = body;

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Geçersiz rol. USER, MANAGER veya ADMIN olmalı." },
        { status: 400 }
      );
    }

    // Son ADMIN'ı rolünden düşürmeyi engelle
    if (role !== "ADMIN") {
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { role: true },
      });
      if (currentUser?.role === "ADMIN") {
        const adminCount = await prisma.user.count({
          where: { role: "ADMIN" },
        });
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: "Son admin kullanıcıyı düşüremezsiniz. En az bir ADMIN kalmalı." },
            { status: 400 }
          );
        }
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Users PATCH error:", error);
    return NextResponse.json(
      { error: "Kullanıcı güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Kullanıcı sil (sadece ADMIN)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminAuth();
    if (auth.error) return auth.error;

    const id = params.id;

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      );
    }

    // Kendini silmeyi engelle
    if (auth.session!.user.id === id) {
      return NextResponse.json(
        { error: "Kendi hesabınızı silemezsiniz" },
        { status: 400 }
      );
    }

    // Son ADMIN'ı silmeyi engelle
    if (targetUser.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Son admin kullanıcıyı silemezsiniz. En az bir ADMIN kalmalı." },
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Users DELETE error:", error);
    return NextResponse.json(
      { error: "Kullanıcı silinemedi" },
      { status: 500 }
    );
  }
}
