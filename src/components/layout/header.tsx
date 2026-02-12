"use client";

import { useSession } from "next-auth/react";
import { User, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface NotificationResponse {
  notifications: Array<{ id: string; title: string; message: string; read: boolean; createdAt: string }>;
  unreadCount: number;
}

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession();

  const { data: notifData } = useQuery<NotificationResponse>({
    queryKey: ["notifications-badge"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=5", { cache: "no-store" });
      if (!res.ok) return { notifications: [], unreadCount: 0 };
      return res.json();
    },
    refetchInterval: 30000,
    enabled: !!session,
  });

  const unreadCount = notifData?.unreadCount || 0;
  const isSupplier = session?.user?.role === "SUPPLIER";
  const notifLink = isSupplier ? "/tedarikci/bildirimler" : "/bildirimler";

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4 sm:px-6">
      <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">{title}</h1>
      
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href={notifLink}>
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span>{session?.user?.name || session?.user?.email}</span>
        </div>
      </div>
    </header>
  );
}
