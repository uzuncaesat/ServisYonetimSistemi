"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Banknote, TrendingUp, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";

interface TimesheetSummary {
  id: string;
  yil: number;
  ay: number;
  vehicle: { plaka: string; marka: string | null };
  project: { ad: string };
  entries: Array<{
    tarih: string;
    seferSayisi: number;
    birimFiyatSnapshot: number;
    route: { ad: string };
  }>;
  toplamSefer: number;
  toplamTutar: number;
}

async function fetchTimesheets(yil: number, ay: number): Promise<TimesheetSummary[]> {
  const res = await fetch(`/api/supplier-portal/timesheets?yil=${yil}&ay=${ay}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Puantajlar yüklenemedi");
  return res.json();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(amount);
}

const aylar = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

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

export default function SupplierTimesheetsPage() {
  const now = new Date();
  const [yil, setYil] = useState(now.getFullYear());
  const [ay, setAy] = useState(now.getMonth() + 1);

  const { data: timesheets, isLoading } = useQuery({
    queryKey: ["supplier-timesheets", yil, ay],
    queryFn: () => fetchTimesheets(yil, ay),
  });

  const totalRevenue = timesheets?.reduce((sum, ts) => sum + ts.toplamTutar, 0) || 0;
  const totalTrips = timesheets?.reduce((sum, ts) => sum + ts.toplamSefer, 0) || 0;

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Puantaj / Hakediş</h1>
          <p className="text-sm text-muted-foreground">
            Aylık sefer sayıları ve hakediş tutarlarınız.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={String(yil)} onValueChange={(v) => setYil(Number(v))}>
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(ay)} onValueChange={(v) => setAy(Number(v))}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {aylar.map((a, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Puantaj Sayısı"
          value={timesheets?.length ?? 0}
          icon={ClipboardList}
          loading={isLoading}
        />
        <StatCard
          label="Toplam Sefer"
          value={totalTrips}
          icon={TrendingUp}
          loading={isLoading}
        />
        <StatCard
          label="Toplam Hakediş"
          value={formatCurrency(totalRevenue)}
          icon={Banknote}
          loading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {aylar[ay - 1]} {yil} Puantajları
          </CardTitle>
          <CardDescription>
            Seçilen döneme ait araç bazlı sefer ve hakediş özetiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!isLoading && (!timesheets || timesheets.length === 0) ? (
            <EmptyState
              icon={ClipboardList}
              title="Kayıt yok"
              description="Bu döneme ait puantaj bulunmuyor."
              className="m-5"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proje</TableHead>
                    <TableHead>Araç</TableHead>
                    <TableHead className="text-right">Toplam Sefer</TableHead>
                    <TableHead className="text-right">Hakediş</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeleton columns={4} />
                  ) : (
                    <>
                      {timesheets?.map((ts) => (
                        <TableRow key={ts.id}>
                          <TableCell>
                            <Badge variant="secondary">{ts.project.ad}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {ts.vehicle.plaka}
                            {ts.vehicle.marka && (
                              <span className="ml-2 text-sm text-muted-foreground">
                                ({ts.vehicle.marka})
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {ts.toplamSefer}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatCurrency(ts.toplamTutar)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {timesheets && timesheets.length > 0 ? (
                        <TableRow className="bg-muted/30 font-medium">
                          <TableCell colSpan={2}>TOPLAM</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {totalTrips}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-primary">
                            {formatCurrency(totalRevenue)}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
