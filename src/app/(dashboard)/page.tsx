"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Building2,
  Car,
  Users,
  FolderKanban,
  Route,
  ClipboardList,
  ArrowUpRight,
  FileText,
  Calculator,
  Plus,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { TrialBanner } from "@/components/subscription/trial-banner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

interface DashboardStats {
  projects: number;
  suppliers: number;
  vehicles: number;
  drivers: number;
  routes: number;
  timesheets: number;
  trend?: { date: string; value: number }[];
  totalTrips?: number;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
  if (!res.ok) throw new Error("İstatistikler yüklenemedi");
  return res.json();
}

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  href: string;
  loading?: boolean;
}

function StatCard({ label, value, icon: Icon, href, loading }: StatCardProps) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-colors hover:border-foreground/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
              <Icon className="h-4 w-4" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 transition-all group-hover:text-foreground group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
          <div className="mt-4 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {value}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const cards = [
    { label: "Projeler", value: stats?.projects ?? 0, icon: FolderKanban, href: "/projeler" },
    { label: "Tedarikçiler", value: stats?.suppliers ?? 0, icon: Building2, href: "/tedarikciler" },
    { label: "Araçlar", value: stats?.vehicles ?? 0, icon: Car, href: "/araclar" },
    { label: "Şoförler", value: stats?.drivers ?? 0, icon: Users, href: "/soforler" },
    { label: "Güzergahlar", value: stats?.routes ?? 0, icon: Route, href: "/projeler" },
    { label: "Puantajlar", value: stats?.timesheets ?? 0, icon: ClipboardList, href: "/puantaj" },
  ];

  const quickActions = [
    { title: "Yeni Proje", description: "Proje oluştur", href: "/projeler/yeni", icon: FolderKanban },
    { title: "Araç Ekle", description: "Yeni araç kaydı", href: "/araclar/yeni", icon: Car },
    { title: "Puantaj Gir", description: "Günlük giriş", href: "/puantaj", icon: Calculator },
    { title: "Rapor Oluştur", description: "Aylık rapor", href: "/raporlar", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <TrialBanner />

      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Hoş geldiniz
        </h1>
        <p className="text-sm text-muted-foreground">
          Servis taşımacılığı operasyonlarınıza genel bakış.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            href={card.href}
            loading={isLoading}
          />
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle>Son 30 günde sefer hacmi</CardTitle>
            <CardDescription>Günlük toplam sefer sayısı</CardDescription>
          </div>
          {stats?.totalTrips !== undefined ? (
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Toplam
              </p>
              <p className="text-xl font-semibold tabular-nums">
                {stats.totalTrips}
              </p>
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : stats?.trend && stats.trend.length > 0 ? (
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.trend}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                      padding: "6px 8px",
                      color: "hsl(var(--popover-foreground))",
                    }}
                    labelFormatter={(label) => {
                      const d = new Date(label as string);
                      return d.toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "short",
                      });
                    }}
                    formatter={(value: number) => [value, "Sefer"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.5}
                    fill="url(#areaFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-10 text-center">
              Henüz veri bulunmuyor.
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Hızlı işlemler</h2>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant="outline"
                asChild
                className="group h-auto justify-start gap-3 px-3 py-3"
              >
                <Link href={action.href}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium leading-tight">
                      {action.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <Plus className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:rotate-90" />
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
