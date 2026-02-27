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
  ChevronRight,
  Bell,
  CreditCard,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

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
  { href: "/ayarlar/abonelik", label: "Abonelik", icon: CreditCard, adminOnly: true },
  { href: "/kullanicilar", label: "Kullanıcılar", icon: UserCog, adminOnly: true },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      {/* Logo */}
      <div className="relative p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              UZHAN ERP
            </h1>
            <p className="text-xs text-slate-400">Milenyum Lite</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide relative min-h-0">
        {menuItems.filter((item) => !("adminOnly" in item && item.adminOnly) || session?.user?.role === "ADMIN").map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
              )}
              
              {/* Icon container */}
              <div className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300",
                isActive 
                  ? "bg-white/20" 
                  : "bg-slate-800/50 group-hover:bg-slate-700/50 group-hover:scale-110"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              
              <span className="font-medium flex-1">{item.label}</span>
              
              {/* Arrow indicator */}
              <ChevronRight className={cn(
                "w-4 h-4 transition-all duration-300 opacity-0 -translate-x-2",
                isActive ? "opacity-100 translate-x-0" : "group-hover:opacity-50 group-hover:translate-x-0"
              )} />
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="relative p-4 border-t border-white/10">
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-3 mb-3 rounded-xl bg-white/5">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold text-sm">
            {session?.user?.email?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.name || session?.user?.email?.split("@")[0] || "Admin"}
              </p>
              {session?.user?.role && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  session.user.role === "ADMIN" 
                    ? "bg-red-500/20 text-red-300" 
                    : session.user.role === "MANAGER"
                    ? "bg-amber-500/20 text-amber-300"
                    : session.user.role === "SUPPLIER"
                    ? "bg-green-500/20 text-green-300"
                    : "bg-blue-500/20 text-blue-300"
                }`}>
                  {session.user.role === "ADMIN" ? "Admin" : session.user.role === "MANAGER" ? "Projeci" : session.user.role === "SUPPLIER" ? "Tedarikçi" : "Kullanıcı"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate">
              {session?.user?.email || "admin@uzhanerp.com"}
            </p>
          </div>
        </div>
        
        {/* Theme toggle */}
        <ThemeToggle className="mb-2" />
        
        {/* Logout button */}
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-red-500/10 rounded-xl transition-all duration-300 group"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800/50 group-hover:bg-red-500/20 transition-all duration-300 mr-3">
            <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
          </div>
          <span className="group-hover:text-red-400 transition-colors">Çıkış Yap</span>
        </Button>
      </div>
    </div>
  );
}
