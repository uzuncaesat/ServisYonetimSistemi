import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/storage";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(req: NextRequest) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const ownerType = formData.get("ownerType") as string;
    const ownerId = formData.get("ownerId") as string;
    const docType = formData.get("docType") as string;
    const title = formData.get("title") as string;
    const validFrom = formData.get("validFrom") as string;
    const validTo = formData.get("validTo") as string;

    if (!file) {
      return NextResponse.json({ error: "Dosya zorunludur" }, { status: 400 });
    }

    if (!ownerType || !ownerId || !docType || !title) {
      return NextResponse.json({ error: "Tüm alanlar zorunludur" }, { status: 400 });
    }

    if (ownerType !== "VEHICLE" && ownerType !== "DRIVER") {
      return NextResponse.json({ error: "Geçersiz sahip türü" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Sadece PDF dosyaları kabul edilir" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Dosya boyutu 20MB'dan büyük olamaz" }, { status: 400 });
    }

    if (ownerType === "VEHICLE") {
      const v = await prisma.vehicle.findUnique({ where: { id: ownerId } });
      if (!v) return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });
      if (
        session!.user.organizationId &&
        v.organizationId !== session!.user.organizationId
      ) {
        return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
      }
    } else {
      const d = await prisma.driver.findUnique({ where: { id: ownerId } });
      if (!d) return NextResponse.json({ error: "Şoför bulunamadı" }, { status: 404 });
      if (
        session!.user.organizationId &&
        d.organizationId !== session!.user.organizationId
      ) {
        return NextResponse.json({ error: "Erişim reddedildi" }, { status: 403 });
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isProd = process.env.NODE_ENV === "production";
    const hasBlobToken =
      typeof process.env.BLOB_READ_WRITE_TOKEN === "string" &&
      process.env.BLOB_READ_WRITE_TOKEN.length > 0;

    if (isProd && !hasBlobToken) {
      console.error(
        "[Document Upload] BLOB_READ_WRITE_TOKEN tanımlı değil. Vercel filesystem read-only olduğu için yükleme yapılamaz."
      );
      return NextResponse.json(
        {
          error:
            "Sunucu depolaması yapılandırılmamış. Vercel projenizde Storage > Blob bağlayın veya BLOB_READ_WRITE_TOKEN ortam değişkenini tanımlayın.",
        },
        { status: 500 }
      );
    }

    let storagePath: string;
    let fileName: string;
    try {
      const result = await saveFile(buffer, file.name, ownerType, ownerId);
      storagePath = result.storagePath;
      fileName = result.fileName;
    } catch (storageErr) {
      console.error("[Document Upload] Storage error:", storageErr);
      const message =
        storageErr instanceof Error ? storageErr.message : "Bilinmeyen depolama hatası";
      return NextResponse.json(
        { error: `Dosya depolanamadı: ${message}` },
        { status: 500 }
      );
    }

    void fileName;

    try {
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
    } catch (dbErr) {
      console.error("[Document Upload] DB error:", dbErr);
      const message = dbErr instanceof Error ? dbErr.message : "Bilinmeyen veritabanı hatası";
      return NextResponse.json(
        { error: `Kayıt oluşturulamadı: ${message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Document Upload] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    return NextResponse.json(
      { error: `Dosya yüklenemedi: ${message}` },
      { status: 500 }
    );
  }
}
