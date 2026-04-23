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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, Edit, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";

interface Supplier {
  id: string;
  firmaAdi: string;
  vergiNo: string | null;
  vergiDairesi: string | null;
  telefon: string | null;
  email: string | null;
  _count: {
    vehicles: number;
  };
}

async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await fetch("/api/suppliers");
  if (!res.ok) throw new Error("Tedarikçiler yüklenemedi");
  return res.json();
}

async function deleteSupplier(id: string) {
  const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Tedarikçi silinemedi");
  return res.json();
}

export default function SuppliersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: fetchSuppliers,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Tedarikçi silindi" });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Tedarikçi silinemedi",
        variant: "destructive",
      });
    },
  });

  const hasItems = (suppliers?.length ?? 0) > 0;

  return (
    <div>
      <PageHeader
        title="Tedarikçiler"
        description="Tedarikçi firmalarını yönetin."
        actionLabel="Yeni tedarikçi"
        actionHref="/tedarikciler/yeni"
      />

      {!isLoading && !hasItems ? (
        <EmptyState
          icon={Building2}
          title="Henüz tedarikçi yok"
          description="İlk tedarikçi firmanızı ekleyerek başlayın."
          action={
            <Button asChild>
              <Link href="/tedarikciler/yeni">Yeni tedarikçi</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma adı</TableHead>
                <TableHead>Vergi no</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Araç</TableHead>
                <TableHead className="w-[60px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton columns={6} />
              ) : (
                suppliers?.map((supplier) => (
                  <TableRow
                    key={supplier.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/tedarikciler/${supplier.id}`)
                    }
                  >
                    <TableCell className="font-medium">
                      {supplier.firmaAdi}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {supplier.vergiNo || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {supplier.telefon || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {supplier.email || "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {supplier._count.vehicles}
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
                              <Link href={`/tedarikciler/${supplier.id}/duzenle`}>
                                <Edit /> Düzenle
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteId(supplier.id)}
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
            <AlertDialogTitle>Tedarikçiyi sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu tedarikçiyi silmek istediğinizden emin misiniz? Bu işlem geri
              alınamaz.
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
