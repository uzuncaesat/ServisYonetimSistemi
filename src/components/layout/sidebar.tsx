"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  Car,
  Users,
  UserCog,
  FolderKanban,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Briefcase,
  Truck,
  Bell,
  CreditCard,
  ChevronDown,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const menuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projeler", label: "Projeler", icon: FolderKanban },
  { href: "/tedarikciler", label: "Tedarikçiler", icon: Building2 },
  { href: "/araclar", label: "Araçlar", icon: Car },
  { href: "/soforler", label: "Şoförler", icon: Users },
  { href: "/puantaj", label: "Puantaj", icon: ClipboardList },
  { href: "/ek-is", label: "Ek İş/Mesai", icon: Briefcase },
  { href: "/raporlar", label: "Raporlar", icon: FileText },
  { href: "/bildirimler", label: "Bildirimler", icon: Bell },
  {
    href: "/ayarlar/abonelik",
    label: "Abonelik",
    icon: CreditCard,
    adminOnly: true,
  },
  {
    href: "/kullanicilar",
    label: "Kullanıcılar",
    icon: UserCog,
    adminOnly: true,
  },
];

interface SidebarProps {
  onNavigate?: () => void;
}

function roleLabel(role?: string | null) {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "MANAGER":
      return "Projeci";
    case "SUPPLIER":
      return "Tedarikçi";
    default:
      return "Kullanıcı";
  }
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initial =
    session?.user?.name?.charAt(0).toUpperCase() ||
    session?.user?.email?.charAt(0).toUpperCase() ||
    "A";
  const displayName =
    session?.user?.name || session?.user?.email?.split("@")[0] || "Admin";

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground">
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Truck className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">UZHAN</span>
          <span className="text-[11px] text-muted-foreground">
            Milenyum Lite
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 min-h-0">
        <div className="mb-1 px-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Menü
          </span>
        </div>
        <div className="space-y-0.5">
          {menuItems
            .filter(
              (item) =>
                !("adminOnly" in item && item.adminOnly) ||
                session?.user?.role === "ADMIN"
            )
            .map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {isActive ? (
                    <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-primary" />
                  ) : null}
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
        </div>
      </nav>

      <div className="border-t border-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {roleLabel(session?.user?.role as string | undefined)}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-[232px]">
            <DropdownMenuLabel className="truncate">
              {session?.user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mounted ? (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sun className="h-4 w-4" />
                  Tema
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun /> Aydınlık
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon /> Karanlık
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor /> Sistem
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="text-destructive" /> Çıkış yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
