import { prisma } from "@/lib/prisma";

export type NotificationType = 
  | "DOCUMENT_EXPIRY"
  | "TIMESHEET_APPROVED" 
  | "REPORT_READY"
  | "GENERAL";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
}

/**
 * Tek bir kullanıcıya bildirim oluştur
 */
export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
    },
  });
}

/**
 * Birden fazla kullanıcıya aynı bildirimi gönder
 */
export async function createBulkNotifications(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string
) {
  return prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type,
      title,
      message,
    })),
  });
}

/**
 * Belirli bir role sahip tüm kullanıcılara bildirim gönder
 */
export async function notifyByRole(
  roles: string[],
  type: NotificationType,
  title: string,
  message: string
) {
  const users = await prisma.user.findMany({
    where: { role: { in: roles } },
    select: { id: true },
  });

  if (users.length === 0) return;

  return createBulkNotifications(
    users.map((u) => u.id),
    type,
    title,
    message
  );
}

/**
 * Tedarikçiye bağlı kullanıcılara bildirim gönder
 */
export async function notifySupplier(
  supplierId: string,
  type: NotificationType,
  title: string,
  message: string
) {
  const users = await prisma.user.findMany({
    where: { supplierId, role: "SUPPLIER" },
    select: { id: true },
  });

  if (users.length === 0) return;

  return createBulkNotifications(
    users.map((u) => u.id),
    type,
    title,
    message
  );
}
