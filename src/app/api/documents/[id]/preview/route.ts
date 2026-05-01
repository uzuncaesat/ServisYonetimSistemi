import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFile } from "@/lib/storage";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

// GET - Evrak önizle (inline)
export async function GET(
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

    const fileBuffer = await getFile(document.storagePath);

    if (!fileBuffer) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `inline; filename="${document.fileName}"`,
        "Content-Length": document.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error("Document preview error:", error);
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    return NextResponse.json(
      { error: `Dosya önizlenemedi: ${message}` },
      { status: 500 }
    );
  }
}
