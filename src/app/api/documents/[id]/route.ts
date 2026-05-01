import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

// DELETE - Evrak sil
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        vehicle: { select: { organizationId: true } },
        driver: { select: { organizationId: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Evrak bulunamadı" }, { status: 404 });
    }

    const docOrgId =
      document.vehicle?.organizationId ?? document.driver?.organizationId ?? null;
    if (
      session!.user.organizationId &&
      docOrgId &&
      docOrgId !== session!.user.organizationId
    ) {
      return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
    }

    await deleteFile(document.storagePath);

    await prisma.document.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document DELETE error:", error);
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    return NextResponse.json(
      { error: `Evrak silinemedi: ${message}` },
      { status: 500 }
    );
  }
}
