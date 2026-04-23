"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  FileWarning,
  ClipboardCheck,
  FileText,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}

async function fetchNotifications(): Promise<NotificationResponse> {
  const res = await fetch("/api/notifications?limit=50", { cache: "no-store" });
  if (!res.ok) throw new Error("Bildirimler yüklenemedi");
  return res.json();
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "DOCUMENT_EXPIRY":
      return FileWarning;
    case "TIMESHEET_APPROVED":
      return ClipboardCheck;
    case "REPORT_READY":
      return FileText;
    default:
      return Bell;
  }
}

function getNotificationAccent(type: string) {
  switch (type) {
    case "DOCUMENT_EXPIRY":
      return "text-destructive";
    case "TIMESHEET_APPROVED":
      return "text-emerald-600 dark:text-emerald-400";
    case "REPORT_READY":
      return "text-primary";
    default:
      return "text-muted-foreground";
  }
}

export default function SupplierNotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: ids }),
      });
      if (!res.ok) throw new Error("Hata");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-badge"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (!res.ok) throw new Error("Hata");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-badge"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Bildirimler</h1>
          <p className="text-sm text-muted-foreground">
            {data?.unreadCount
              ? `${data.unreadCount} okunmamış bildirim`
              : "Tüm bildirimler okundu."}
          </p>
        </div>
        {data?.unreadCount ? (
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4" />
            Tümünü okundu işaretle
          </Button>
        ) : null}
      </div>

      <div className="rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-9 w-9 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.notifications.length ? (
          <EmptyState
            icon={Bell}
            title="Bildirim yok"
            description="Yeni bildirimler geldiğinde burada görünür."
            className="border-0 bg-transparent"
          />
        ) : (
          <ul className="divide-y divide-border">
            {data.notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              return (
                <li
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-4",
                    !notification.read && "bg-primary/[0.03]"
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        getNotificationAccent(notification.type)
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {notification.title}
                      </p>
                      {!notification.read ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </p>
                    {notification.type === "REPORT_READY" && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="mt-2"
                      >
                        <Link href="/tedarikci/raporlar">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Raporu görüntüle
                        </Link>
                      </Button>
                    )}
                  </div>
                  {!notification.read ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => markReadMutation.mutate([notification.id])}
                      disabled={markReadMutation.isPending}
                      aria-label="Okundu olarak işaretle"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
