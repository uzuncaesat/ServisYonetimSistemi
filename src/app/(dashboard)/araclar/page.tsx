"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Car, Edit, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";

interface Vehicle {
  id: string;
  plaka: string;
  marka: string | null;
  model: string | null;
  kisiSayisi: number | null;
  supplier: {
    id: string;
    firmaAdi: string;
  };
  driver: {
    id: string;
    adSoyad: string;
  } | null;
  _count: {
    projects: number;
    documents: number;
  };
}

async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch("/api/vehicles");
  if (!res.ok) throw new Error("Araçlar yüklenemedi");
  return res.json();
}

async function deleteVehicle(id: string) {
  const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Araç silinemedi");
  return res.json();
}

export default function VehiclesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Araç silindi" });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Araç silinemedi",
        variant: "destructive",
      });
    },
  });

  const hasItems = (vehicles?.length ?? 0) > 0;

  return (
    <div>
      <PageHeader
        title="Araçlar"
        description="Araç envanterini yönetin."
        actionLabel="Yeni araç"
        actionHref="/araclar/yeni"
      />

      {!isLoading && !hasItems ? (
        <EmptyState
          icon={Car}
          title="Henüz araç yok"
          description="İlk aracınızı ekleyerek envanter oluşturmaya başlayın."
          action={
            <Button asChild>
              <Link href="/araclar/yeni">Yeni araç</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plaka</TableHead>
                <TableHead>Marka / Model</TableHead>
                <TableHead>Kapasite</TableHead>
                <TableHead>Tedarikçi</TableHead>
                <TableHead>Şoför</TableHead>
                <TableHead>Proje</TableHead>
                <TableHead className="w-[60px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={7} />
              ) : (
                vehicles?.map((vehicle) => (
                  <TableRow
                    key={vehicle.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/araclar/${vehicle.id}`)}
                  >
                    <TableCell className="font-medium">
                      {vehicle.plaka}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {vehicle.marka || "—"} {vehicle.model || ""}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {vehicle.kisiSayisi || "—"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/tedarikciler/${vehicle.supplier.id}`}
                        className="text-foreground hover:text-primary transition-colors"
                      >
                        {vehicle.supplier.firmaAdi}
                      </Link>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {vehicle.driver ? (
                        <Link
                          href={`/soforler/${vehicle.driver.id}`}
                          className="text-foreground hover:text-primary transition-colors"
                        >
                          {vehicle.driver.adSoyad}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Atanmamış</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{vehicle._count.projects}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex"
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/araclar/${vehicle.id}/duzenle`}>
                                <Edit /> Düzenle
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteId(vehicle.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="text-destructive" /> Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
            <AlertDialogTitle>Aracı sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu aracı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
