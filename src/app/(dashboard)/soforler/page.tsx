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
      toast({ title: "Şoför silindi" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Hata", description: "Şoför silinemedi", variant: "destructive" });
    },
  });

  return (
    <div>
      <PageHeader
        title="Şoförler"
        description="Şoförleri yönetin"
        actionLabel="Yeni Şoför"
        actionHref="/soforler/yeni"
      />

      <div className="overflow-x-auto min-w-0">
        <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Ehliyet Sınıfı</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Atanmış Araç</TableHead>
              <TableHead className="w-[120px]">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : drivers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Henüz şoför eklenmemiş
                </TableCell>
              </TableRow>
            ) : (
              drivers?.map((driver) => (
                <TableRow 
                  key={driver.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/soforler/${driver.id}`)}
                >
                  <TableCell className="font-medium">{driver.adSoyad}</TableCell>
                  <TableCell>{driver.telefon || "-"}</TableCell>
                  <TableCell>
                    {driver.ehliyetSinifi ? (
                      <Badge variant="secondary">{driver.ehliyetSinifi}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{driver.email || "-"}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {driver.vehicle ? (
                      <Link
                        href={`/araclar/${driver.vehicle.id}`}
                        className="text-primary hover:underline"
                      >
                        {driver.vehicle.plaka}
                      </Link>
                    ) : (
                      <span className="text-slate-400">Atanmamış</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/soforler/${driver.id}/duzenle`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(driver.id)}
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
            <AlertDialogTitle>Şoförü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu şoförü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
