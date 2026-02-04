import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFile } from "@/lib/storage";

// GET - Evrak önizle (inline)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Evrak bulunamadı" },
        { status: 404 }
      );
    }

    const fileBuffer = await getFile(document.storagePath);

    if (!fileBuffer) {
      return NextResponse.json(
        { error: "Dosya bulunamadı" },
        { status: 404 }
      );
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `inline; filename="${document.fileName}"`,
        "Content-Length": document.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error("Document preview error:", error);
    return NextResponse.json(
      { error: "Dosya önizlenemedi" },
      { status: 500 }
    );
  }
}
