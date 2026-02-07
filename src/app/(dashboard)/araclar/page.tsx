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
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

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
      toast({ title: "Hata", description: "Araç silinemedi", variant: "destructive" });
    },
  });

  return (
    <div>
      <PageHeader
        title="Araçlar"
        description="Araç envanterini yönetin"
        actionLabel="Yeni Araç"
        actionHref="/araclar/yeni"
      />

      <div className="overflow-x-auto min-w-0">
        <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plaka</TableHead>
              <TableHead>Marka / Model</TableHead>
              <TableHead>Kişi Sayısı</TableHead>
              <TableHead>Tedarikçi</TableHead>
              <TableHead>Şoför</TableHead>
              <TableHead>Proje</TableHead>
              <TableHead className="w-[120px]">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : vehicles?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Henüz araç eklenmemiş
                </TableCell>
              </TableRow>
            ) : (
              vehicles?.map((vehicle) => (
                <TableRow 
                  key={vehicle.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/araclar/${vehicle.id}`)}
                >
                  <TableCell className="font-medium">{vehicle.plaka}</TableCell>
                  <TableCell>
                    {vehicle.marka || "-"} {vehicle.model || ""}
                  </TableCell>
                  <TableCell>{vehicle.kisiSayisi || "-"}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/tedarikciler/${vehicle.supplier.id}`}
                      className="text-primary hover:underline"
                    >
                      {vehicle.supplier.firmaAdi}
                    </Link>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {vehicle.driver ? (
                      <Link
                        href={`/soforler/${vehicle.driver.id}`}
                        className="text-primary hover:underline"
                      >
                        {vehicle.driver.adSoyad}
                      </Link>
                    ) : (
                      <span className="text-slate-400">Atanmamış</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{vehicle._count.projects}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/araclar/${vehicle.id}/duzenle`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(vehicle.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aracı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu aracı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
