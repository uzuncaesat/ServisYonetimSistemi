export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBulkNotifications, notifySupplier } from "@/lib/notifications";
import { sendEmail, documentExpiryEmailHtml } from "@/lib/email";

// Vercel Cron veya harici cron ile çağrılacak
// Günde 1 kez çalışması yeterli
export async function GET(req: NextRequest) {
  try {
    // Cron secret kontrolü (opsiyonel güvenlik)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const now = new Date();
    const alertDays = [30, 15, 7, 1]; // Bildirim gönderilecek gün eşikleri
    
    let notificationsCreated = 0;

    for (const days of alertDays) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);
      
      // O gün süresi dolacak evrakları bul
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const expiringDocs = await prisma.document.findMany({
        where: {
          validTo: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: {
          id: true,
          title: true,
          docType: true,
          validTo: true,
          ownerType: true,
          vehicle: {
            select: {
              plaka: true,
              supplierId: true,
            },
          },
          driver: {
            select: {
              adSoyad: true,
            },
          },
        },
      });

      for (const doc of expiringDocs) {
        const ownerInfo =
          doc.ownerType === "VEHICLE" && doc.vehicle
            ? `Araç: ${doc.vehicle.plaka}`
            : doc.ownerType === "DRIVER" && doc.driver
            ? `Şoför: ${doc.driver.adSoyad}`
            : "Bilinmiyor";

        const title = `Evrak Süresi Uyarısı - ${days} gün kaldı`;
        const message = `${doc.title} (${doc.docType}) evrakının süresi ${days} gün içinde dolacak. ${ownerInfo}`;

        const validToStr = doc.validTo ? new Intl.DateTimeFormat("tr-TR").format(new Date(doc.validTo)) : "-";

        // Admin ve Manager'lara bildir
        const adminsAndManagers = await prisma.user.findMany({
          where: { role: { in: ["ADMIN", "MANAGER"] } },
          select: { id: true, email: true },
        });

        if (adminsAndManagers.length > 0) {
          await createBulkNotifications(
            adminsAndManagers.map((u) => u.id),
            "DOCUMENT_EXPIRY",
            title,
            message
          );
          notificationsCreated += adminsAndManagers.length;

          // Kritik uyarılarda e-posta gönder (7 gün ve altı)
          if (days <= 7) {
            const emailHtml = documentExpiryEmailHtml(
              `${doc.title} (${doc.docType})`,
              ownerInfo,
              days,
              validToStr
            );
            for (const user of adminsAndManagers) {
              await sendEmail({
                to: user.email,
                subject: `[UZHAN ERP] ${title}`,
                html: emailHtml,
              });
            }
          }
        }

        // Araç evrakıysa ilgili tedarikçiye de bildir
        if (doc.ownerType === "VEHICLE" && doc.vehicle?.supplierId) {
          await notifySupplier(
            doc.vehicle.supplierId,
            "DOCUMENT_EXPIRY",
            title,
            message
          );
          notificationsCreated++;

          // Tedarikçi kullanıcılarına da e-posta gönder (7 gün ve altı)
          if (days <= 7) {
            const supplierUsers = await prisma.user.findMany({
              where: { supplierId: doc.vehicle.supplierId, role: "SUPPLIER" },
              select: { email: true },
            });
            const emailHtml = documentExpiryEmailHtml(
              `${doc.title} (${doc.docType})`,
              ownerInfo,
              days,
              validToStr
            );
            for (const su of supplierUsers) {
              await sendEmail({
                to: su.email,
                subject: `[UZHAN ERP] ${title}`,
                html: emailHtml,
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      notificationsCreated,
      checkedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Document check cron error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
