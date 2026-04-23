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
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <h1 className="truncate text-sm font-medium tracking-tight text-foreground">
        {title}
      </h1>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative h-8 w-8" asChild>
          <Link href={notifLink} aria-label="Bildirimler">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </Button>

        <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          <User className="h-3.5 w-3.5" />
          <span>{session?.user?.name || session?.user?.email}</span>
        </div>
      </div>
    </header>
  );
}
