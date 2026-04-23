"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Car, FolderKanban, TrendingUp, Banknote, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface DashboardData {
  supplier: {
    id: string;
    firmaAdi: string;
    telefon: string | null;
    email: string | null;
  };
  stats: {
    vehicleCount: number;
    projectCount: number;
    totalTrips: number;
    totalRevenue: number;
    currentMonthTrips: number;
    currentMonthRevenue: number;
  };
  vehicles: Array<{
    id: string;
    plaka: string;
    marka: string | null;
    model: string | null;
    driver: string | null;
    projects: string[];
  }>;
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/supplier-portal/dashboard", { cache: "no-store" });
  if (!res.ok) throw new Error("Veriler yüklenemedi");
  return res.json();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount);
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  loading?: boolean;
}

function StatCard({ label, value, icon: Icon, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="mt-4 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SupplierDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["supplier-dashboard"],
    queryFn: fetchDashboard,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {data ? `Hoş geldiniz, ${data.supplier.firmaAdi}` : "Hoş geldiniz"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Araçlarınızın durumunu ve hakediş bilgilerinizi buradan takip edebilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Araç Sayısı"
          value={stats?.vehicleCount ?? 0}
          icon={Car}
          loading={isLoading}
        />
        <StatCard
          label="Aktif Proje"
          value={stats?.projectCount ?? 0}
          icon={FolderKanban}
          loading={isLoading}
        />
        <StatCard
          label="Bu Ay Sefer"
          value={stats?.currentMonthTrips ?? 0}
          icon={TrendingUp}
          loading={isLoading}
        />
        <StatCard
          label="Bu Ay Hakediş"
          value={stats ? formatCurrency(stats.currentMonthRevenue) : "—"}
          icon={Banknote}
          loading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-4 w-4 text-muted-foreground" />
            Araçlarım
          </CardTitle>
          <CardDescription>
            Şoförler ve atandıkları projelerle birlikte araç listeniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5">
              <Skeleton className="h-20 w-full" />
            </div>
          ) : !data?.vehicles.length ? (
            <EmptyState
              icon={Car}
              title="Henüz araç yok"
              description="Size tanımlanmış araçlar burada listelenir."
              className="m-5"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plaka</TableHead>
                    <TableHead>Marka / Model</TableHead>
                    <TableHead>Şoför</TableHead>
                    <TableHead>Projeler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.plaka}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {vehicle.marka || "-"} {vehicle.model || ""}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {vehicle.driver || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {vehicle.projects.length > 0 ? (
                            vehicle.projects.map((p, i) => (
                              <Badge key={i} variant="secondary">
                                {p}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
