"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, FileWarning, ClipboardCheck, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

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

function getNotificationColor(type: string) {
  switch (type) {
    case "DOCUMENT_EXPIRY":
      return "text-red-500";
    case "TIMESHEET_APPROVED":
      return "text-green-500";
    case "REPORT_READY":
      return "text-blue-500";
    default:
      return "text-gray-500";
  }
}

export default function SupplierNotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30000, // 30 saniyede bir kontrol
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
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bildirimler</h1>
          <p className="text-muted-foreground mt-1">
            {data?.unreadCount ? `${data.unreadCount} okunmamış bildirim` : "Tüm bildirimler okundu"}
          </p>
        </div>
        {data?.unreadCount ? (
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Tümünü Okundu İşaretle
          </Button>
        ) : null}
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
            </div>
          ) : !data?.notifications.length ? (
            <div className="py-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Henüz bildirim bulunmuyor.</p>
            </div>
          ) : (
            <div className="divide-y">
              {data.notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);

                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 transition-colors ${
                      !notification.read ? "bg-green-50/50 dark:bg-green-950/10" : ""
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-muted/50 mt-0.5`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{notification.title}</p>
                        {!notification.read && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-green-500">
                            Yeni
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => markReadMutation.mutate([notification.id])}
                        disabled={markReadMutation.isPending}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
