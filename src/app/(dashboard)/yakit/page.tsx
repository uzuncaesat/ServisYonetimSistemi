"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { fuelTypes } from "@/lib/validations";
import { Edit, Fuel, MoreHorizontal, Trash2 } from "lucide-react";

interface Vehicle {
  id: string;
  plaka: string;
  marka: string | null;
  model: string | null;
}

interface FuelEntry {
  id: string;
  tarih: string;
  yakitTipi: string;
  litre: number;
  birimFiyat: number;
  toplamTutar: number;
  km: number;
  istasyon: string | null;
  fisNo: string | null;
  notlar: string | null;
  vehicle: Vehicle;
}

interface FuelResponse {
  entries: FuelEntry[];
  totals: { toplamTutar: number; toplamLitre: number };
}

async function fetchEntries(vehicleId?: string): Promise<FuelResponse> {
  const url = vehicleId
    ? `/api/fuel-entries?vehicleId=${vehicleId}`
    : "/api/fuel-entries";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Yakıt kayıtları yüklenemedi");
  return res.json();
}

async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch("/api/vehicles");
  if (!res.ok) throw new Error("Araçlar alınamadı");
  return res.json();
}

async function deleteEntry(id: string) {
  const res = await fetch(`/api/fuel-entries/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Kayıt silinemedi");
  return res.json();
}

export default function FuelPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [vehicleFilter, setVehicleFilter] = useState<string>("ALL");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["fuel-entries", vehicleFilter],
    queryFn: () =>
      fetchEntries(vehicleFilter === "ALL" ? undefined : vehicleFilter),
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-entries"] });
      toast({ title: "Yakıt kaydı silindi" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Hata", description: "Silinemedi", variant: "destructive" });
    },
  });

  const entries = data?.entries ?? [];
  const totals = data?.totals ?? { toplamTutar: 0, toplamLitre: 0 };

  const fuelTypeLabel = (v: string) =>
    fuelTypes.find((t) => t.value === v)?.label ?? v;

  return (
    <div>
      <PageHeader
        title="Yakıt Yönetimi"
        description="Araç bazında yakıt kayıtlarını tutun, tüketimi takip edin."
        actionLabel="Yeni yakıt kaydı"
        actionHref="/yakit/yeni"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Toplam Kayıt</p>
            <p className="text-2xl font-bold tabular-nums">{entries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Toplam Litre</p>
            <p className="text-2xl font-bold tabular-nums">
              {totals.toplamLitre.toLocaleString("tr-TR", {
                maximumFractionDigits: 2,
              })}{" "}
              L
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Toplam Tutar</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(totals.toplamTutar)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Araç:</span>
        <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
          <SelectTrigger className="w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tümü</SelectItem>
            {vehicles?.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.plaka} — {v.marka ?? ""} {v.model ?? ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isLoading && entries.length === 0 ? (
        <EmptyState
          icon={Fuel}
          title="Henüz yakıt kaydı yok"
          description="İlk yakıt kaydınızı ekleyerek tüketim takibini başlatın."
          action={
            <Button asChild>
              <Link href="/yakit/yeni">Yeni yakıt kaydı</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Araç</TableHead>
                <TableHead>Yakıt</TableHead>
                <TableHead className="text-right">Litre</TableHead>
                <TableHead className="text-right">Birim</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead className="text-right">Km</TableHead>
                <TableHead>İstasyon</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={9} />
              ) : (
                entries.map((e) => (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/yakit/${e.id}/duzenle`)}
                  >
                    <TableCell className="whitespace-nowrap">
                      {formatDate(e.tarih)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {e.vehicle.plaka}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {fuelTypeLabel(e.yakitTipi)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {e.litre.toLocaleString("tr-TR", {
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(e.birimFiyat)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatCurrency(e.toplamTutar)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {e.km.toLocaleString("tr-TR")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.istasyon ?? "—"}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/yakit/${e.id}/duzenle`}>
                              <Edit /> Düzenle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(e.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="text-destructive" /> Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yakıt kaydını sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu kaydı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
