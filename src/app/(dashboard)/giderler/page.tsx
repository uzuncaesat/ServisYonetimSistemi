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
import { expenseCategories } from "@/lib/validations";
import { Edit, MoreHorizontal, Trash2, Wrench } from "lucide-react";

interface Vehicle {
  id: string;
  plaka: string;
  marka: string | null;
  model: string | null;
}

interface Expense {
  id: string;
  tarih: string;
  kategori: string;
  altKategori: string | null;
  tutar: number;
  kdvDahil: boolean;
  km: number | null;
  saglayici: string | null;
  belgeNo: string | null;
  notlar: string | null;
  vehicle: Vehicle;
}

interface ExpenseResponse {
  expenses: Expense[];
  totals: { total: number; byCategory: Record<string, number> };
}

async function fetchExpenses(
  vehicleId?: string,
  kategori?: string
): Promise<ExpenseResponse> {
  const params = new URLSearchParams();
  if (vehicleId) params.set("vehicleId", vehicleId);
  if (kategori) params.set("kategori", kategori);
  const res = await fetch(`/api/vehicle-expenses?${params.toString()}`);
  if (!res.ok) throw new Error("Giderler yüklenemedi");
  return res.json();
}

async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch("/api/vehicles");
  if (!res.ok) throw new Error("Araçlar alınamadı");
  return res.json();
}

async function deleteExpense(id: string) {
  const res = await fetch(`/api/vehicle-expenses/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Silinemedi");
  return res.json();
}

export default function ExpensesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [vehicleFilter, setVehicleFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-expenses", vehicleFilter, categoryFilter],
    queryFn: () =>
      fetchExpenses(
        vehicleFilter === "ALL" ? undefined : vehicleFilter,
        categoryFilter === "ALL" ? undefined : categoryFilter
      ),
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-expenses"] });
      toast({ title: "Gider silindi" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Hata", description: "Silinemedi", variant: "destructive" });
    },
  });

  const expenses = data?.expenses ?? [];
  const totals = data?.totals ?? { total: 0, byCategory: {} };

  const categoryLabel = (v: string) =>
    expenseCategories.find((c) => c.value === v)?.label ?? v;

  const topCategories = Object.entries(totals.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div>
      <PageHeader
        title="Araç Giderleri"
        description="Bakım, sigorta, ceza, lastik gibi giderleri kaydedin ve takip edin."
        actionLabel="Yeni gider"
        actionHref="/giderler/yeni"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Toplam Gider</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(totals.total)}
            </p>
          </CardContent>
        </Card>
        {topCategories.map(([cat, amount]) => (
          <Card key={cat}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">
                {categoryLabel(cat)}
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {formatCurrency(amount)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Araç:</span>
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tümü</SelectItem>
              {vehicles?.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.plaka}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Kategori:</span>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tümü</SelectItem>
              {expenseCategories.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!isLoading && expenses.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Henüz gider kaydı yok"
          description="Bakım, sigorta, ceza gibi giderlerinizi buraya kaydedin."
          action={
            <Button asChild>
              <Link href="/giderler/yeni">Yeni gider</Link>
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
                <TableHead>Kategori</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Sağlayıcı</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={7} />
              ) : (
                expenses.map((e) => (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/giderler/${e.id}/duzenle`)}
                  >
                    <TableCell className="whitespace-nowrap">
                      {formatDate(e.tarih)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {e.vehicle.plaka}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {categoryLabel(e.kategori)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.altKategori ?? e.notlar ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.saglayici ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {formatCurrency(e.tutar)}
                      {!e.kdvDahil && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (KDV hariç)
                        </span>
                      )}
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
                            <Link href={`/giderler/${e.id}/duzenle`}>
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
            <AlertDialogTitle>Gideri sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu gideri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
