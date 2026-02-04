import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/storage";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const ownerType = formData.get("ownerType") as string;
    const ownerId = formData.get("ownerId") as string;
    const docType = formData.get("docType") as string;
    const title = formData.get("title") as string;
    const validFrom = formData.get("validFrom") as string;
    const validTo = formData.get("validTo") as string;

    // Validations
    if (!file) {
      return NextResponse.json({ error: "Dosya zorunludur" }, { status: 400 });
    }

    if (!ownerType || !ownerId || !docType || !title) {
      return NextResponse.json({ error: "Tüm alanlar zorunludur" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Sadece PDF dosyaları kabul edilir" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Dosya boyutu 20MB'dan büyük olamaz" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to storage
    const { storagePath, fileName } = await saveFile(
      buffer,
      file.name,
      ownerType,
      ownerId
    );

    // Create database record
    const document = await prisma.document.create({
      data: {
        ownerType: ownerType as "VEHICLE" | "DRIVER",
        docType,
        title,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storagePath,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        ...(ownerType === "VEHICLE"
          ? { vehicleId: ownerId }
          : { driverId: ownerId }),
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "Dosya yüklenemedi" },
      { status: 500 }
    );
  }
}
