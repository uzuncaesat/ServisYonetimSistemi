import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";

// DELETE - Evrak sil
export async function DELETE(
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

    // Delete file from storage
    await deleteFile(document.storagePath);

    // Delete database record
    await prisma.document.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document DELETE error:", error);
    return NextResponse.json(
      { error: "Evrak silinemedi" },
      { status: 500 }
    );
  }
}
