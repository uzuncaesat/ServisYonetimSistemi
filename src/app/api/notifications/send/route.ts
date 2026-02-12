export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { createNotification, notifySupplier, notifyByRole } from "@/lib/notifications";
import type { NotificationType } from "@/lib/notifications";
import { sendEmail, reportReadyEmailHtml } from "@/lib/email";

// POST - Bildirim gönder (yöneticiler tarafından kullanılır)
export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await req.json();
    const { type, title, message, targetUserId, targetSupplierId, targetRoles } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "type, title ve message alanları zorunludur" },
        { status: 400 }
      );
    }

    const notifType = type as NotificationType;

    // Belirli bir kullanıcıya gönder
    if (targetUserId) {
      await createNotification({
        userId: targetUserId,
        type: notifType,
        title,
        message,
      });
      return NextResponse.json({ success: true, target: "user" });
    }

    // Tedarikçiye gönder
    if (targetSupplierId) {
      await notifySupplier(targetSupplierId, notifType, title, message);
      
      // Rapor hazır ise e-posta da gönder
      if (notifType === "REPORT_READY") {
        const supplier = await prisma.supplier.findUnique({
          where: { id: targetSupplierId },
          select: { firmaAdi: true },
        });
        const supplierUsers = await prisma.user.findMany({
          where: { supplierId: targetSupplierId, role: "SUPPLIER" },
          select: { email: true },
        });
        if (supplier && supplierUsers.length > 0) {
          const emailHtml = reportReadyEmailHtml(
            supplier.firmaAdi,
            message, // mesaj zaten dönemi içeriyor
            "hakediş"
          );
          for (const su of supplierUsers) {
            await sendEmail({
              to: su.email,
              subject: `[UZHAN ERP] Rapor Hazır - ${supplier.firmaAdi}`,
              html: emailHtml,
            });
          }
        }
      }

      return NextResponse.json({ success: true, target: "supplier" });
    }

    // Belirli rollere gönder
    if (targetRoles && Array.isArray(targetRoles)) {
      await notifyByRole(targetRoles, notifType, title, message);
      return NextResponse.json({ success: true, target: "roles" });
    }

    return NextResponse.json(
      { error: "targetUserId, targetSupplierId veya targetRoles belirtilmelidir" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Send notification error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
