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
import { Edit, MoreHorizontal, Route as RouteIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";

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
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Güzergah silindi" });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Güzergah silinemedi",
        variant: "destructive",
      });
    },
  });

  const hasItems = (routes?.length ?? 0) > 0;

  return (
    <div>
      <PageHeader
        title="Güzergahlar"
        description="Proje güzergahlarını yönetin."
        actionLabel="Yeni güzergah"
        actionHref="/guzergahlar/yeni"
      />

      {!isLoading && !hasItems ? (
        <EmptyState
          icon={RouteIcon}
          title="Henüz güzergah yok"
          description="Projelerinize bağlı güzergahları oluşturarak puantaja hazır hale gelin."
          action={
            <Button asChild>
              <Link href="/guzergahlar/yeni">Yeni güzergah</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Güzergah</TableHead>
                <TableHead>Proje</TableHead>
                <TableHead>Başlangıç / Bitiş</TableHead>
                <TableHead>KM</TableHead>
                <TableHead>Birim fiyat</TableHead>
                <TableHead>KDV</TableHead>
                <TableHead>Araç</TableHead>
                <TableHead className="w-[60px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={8} />
              ) : (
                routes?.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell className="font-medium">{route.ad}</TableCell>
                    <TableCell>
                      <Link
                        href={`/projeler/${route.project.id}`}
                        className="text-foreground hover:text-primary transition-colors"
                      >
                        {route.project.ad}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-sm">
                        <p className="text-foreground">
                          {route.baslangicNoktasi || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {route.bitisNoktasi || "—"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {route.km || "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCurrency(route.birimFiyat)}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      %{route.kdvOrani}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {route._count.vehicleRoutes}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/guzergahlar/${route.id}/duzenle`}>
                              <Edit /> Düzenle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(route.id)}
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
            <AlertDialogTitle>Güzergahı sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu güzergahı silmek istediğinizden emin misiniz? İlişkili puantaj
              kayıtları etkilenebilir.
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
