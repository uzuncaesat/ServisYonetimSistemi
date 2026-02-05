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
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";

interface Route {
  id: string;
  ad: string;
  baslangicNoktasi: string | null;
  bitisNoktasi: string | null;
  km: number | null;
  birimFiyat: number;
  kdvOrani: number;
  project: {
    id: string;
    ad: string;
  };
  _count: {
    vehicleRoutes: number;
    timesheetEntries: number;
  };
}

async function fetchRoutes(): Promise<Route[]> {
  const res = await fetch("/api/routes");
  if (!res.ok) throw new Error("Güzergahlar yüklenemedi");
  return res.json();
}

async function deleteRoute(id: string) {
  const res = await fetch(`/api/routes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Güzergah silinemedi");
  return res.json();
}

export default function RoutesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: routes, isLoading } = useQuery({
    queryKey: ["routes"],
    queryFn: fetchRoutes,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      toast({ title: "Güzergah silindi" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Hata", description: "Güzergah silinemedi", variant: "destructive" });
    },
  });

  return (
    <div>
      <PageHeader
        title="Güzergahlar"
        description="Proje güzergahlarını yönetin"
        actionLabel="Yeni Güzergah"
        actionHref="/guzergahlar/yeni"
      />

      <div className="overflow-x-auto min-w-0">
        <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Güzergah Adı</TableHead>
              <TableHead>Proje</TableHead>
              <TableHead>Başlangıç / Bitiş</TableHead>
              <TableHead>KM</TableHead>
              <TableHead>Birim Fiyat</TableHead>
              <TableHead>KDV</TableHead>
              <TableHead>Araç</TableHead>
              <TableHead className="w-[100px]">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : routes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Henüz güzergah eklenmemiş
                </TableCell>
              </TableRow>
            ) : (
              routes?.map((route) => (
                <TableRow key={route.id}>
                  <TableCell className="font-medium">{route.ad}</TableCell>
                  <TableCell>
                    <Link
                      href={`/projeler/${route.project.id}`}
                      className="text-primary hover:underline"
                    >
                      {route.project.ad}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{route.baslangicNoktasi || "-"}</p>
                      <p className="text-slate-500">{route.bitisNoktasi || "-"}</p>
                    </div>
                  </TableCell>
                  <TableCell>{route.km || "-"}</TableCell>
                  <TableCell>{formatCurrency(route.birimFiyat)}</TableCell>
                  <TableCell>%{route.kdvOrani}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{route._count.vehicleRoutes}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/guzergahlar/${route.id}/duzenle`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(route.id)}
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
            <AlertDialogTitle>Güzergahı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu güzergahı silmek istediğinizden emin misiniz? İlişkili puantaj kayıtları etkilenebilir.
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
