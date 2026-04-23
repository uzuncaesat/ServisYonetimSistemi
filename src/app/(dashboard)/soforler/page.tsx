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
import { Edit, MoreHorizontal, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";

interface Driver {
  id: string;
  adSoyad: string;
  telefon: string | null;
  ehliyetSinifi: string | null;
  email: string | null;
  vehicle: {
    id: string;
    plaka: string;
  } | null;
  _count: {
    documents: number;
  };
}

async function fetchDrivers(): Promise<Driver[]> {
  const res = await fetch("/api/drivers");
  if (!res.ok) throw new Error("Şoförler yüklenemedi");
  return res.json();
}

async function deleteDriver(id: string) {
  const res = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Şoför silinemedi");
  return res.json();
}

export default function DriversPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: drivers, isLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: fetchDrivers,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Şoför silindi" });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Şoför silinemedi",
        variant: "destructive",
      });
    },
  });

  const hasItems = (drivers?.length ?? 0) > 0;

  return (
    <div>
      <PageHeader
        title="Şoförler"
        description="Şoförleri yönetin."
        actionLabel="Yeni şoför"
        actionHref="/soforler/yeni"
      />

      {!isLoading && !hasItems ? (
        <EmptyState
          icon={Users}
          title="Henüz şoför yok"
          description="İlk şoförü ekleyerek araç atamalarına başlayın."
          action={
            <Button asChild>
              <Link href="/soforler/yeni">Yeni şoför</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Ehliyet</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Atanmış araç</TableHead>
                <TableHead className="w-[60px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={6} />
              ) : (
                drivers?.map((driver) => (
                  <TableRow
                    key={driver.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/soforler/${driver.id}`)}
                  >
                    <TableCell className="font-medium">
                      {driver.adSoyad}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {driver.telefon || "—"}
                    </TableCell>
                    <TableCell>
                      {driver.ehliyetSinifi ? (
                        <Badge variant="default">{driver.ehliyetSinifi}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {driver.email || "—"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {driver.vehicle ? (
                        <Link
                          href={`/araclar/${driver.vehicle.id}`}
                          className="text-foreground hover:text-primary transition-colors"
                        >
                          {driver.vehicle.plaka}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Atanmamış</span>
                      )}
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
                              <Link href={`/soforler/${driver.id}/duzenle`}>
                                <Edit /> Düzenle
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteId(driver.id)}
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
            <AlertDialogTitle>Şoförü sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu şoförü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
