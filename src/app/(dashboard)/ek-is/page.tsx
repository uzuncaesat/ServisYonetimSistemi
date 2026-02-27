"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { extraWorkSchema, ExtraWorkFormData } from "@/lib/validations/extra-work";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Factory, CheckCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { canEditFactoryPrice, canViewFactoryPrice } from "@/lib/auth";

interface ExtraWork {
  id: string;
  tarih: string;
  aciklama: string;
  fiyat: number;
  fabrikaFiyati: number | null;
  status: string;
  approvedAt: string | null;
  approvedBy: { id: string; name: string | null } | null;
  supplier: { id: string; firmaAdi: string };
  vehicle: { id: string; plaka: string };
  project: { id: string; ad: string };
}

interface Project {
  id: string;
  ad: string;
}

interface Supplier {
  id: string;
  firmaAdi: string;
}

interface Vehicle {
  id: string;
  plaka: string;
  supplierId: string;
}

async function fetchExtraWorks(): Promise<ExtraWork[]> {
  const res = await fetch("/api/extra-work");
  if (!res.ok) throw new Error("Ek işler yüklenemedi");
  return res.json();
}

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Projeler yüklenemedi");
  return res.json();
}

async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await fetch("/api/suppliers");
  if (!res.ok) throw new Error("Tedarikçiler yüklenemedi");
  return res.json();
}

async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch("/api/vehicles");
  if (!res.ok) throw new Error("Araçlar yüklenemedi");
  return res.json();
}

export default function ExtraWorkPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const showFactoryPrice = canViewFactoryPrice(session?.user?.role);
  const canEditFactory = canEditFactoryPrice(session?.user?.role);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExtraWork | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: extraWorks, isLoading } = useQuery({
    queryKey: ["extra-works"],
    queryFn: fetchExtraWorks,
    staleTime: 1000 * 60, // 1 dakika cache
  });

  // Dialog verileri - sadece dialog açıkken yükle
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    enabled: isDialogOpen,
    staleTime: 1000 * 60 * 5, // 5 dakika cache
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: fetchSuppliers,
    enabled: isDialogOpen,
    staleTime: 1000 * 60 * 5, // 5 dakika cache
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
    enabled: isDialogOpen,
    staleTime: 1000 * 60 * 5, // 5 dakika cache
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExtraWorkFormData>({
    resolver: zodResolver(extraWorkSchema),
  });

  const selectedSupplierId = watch("supplierId");

  // Filter vehicles by selected supplier
  const filteredVehicles = vehicles?.filter(
    (v) => v.supplierId === selectedSupplierId
  ) || [];

  const createMutation = useMutation({
    mutationFn: async (data: ExtraWorkFormData) => {
      const res = await fetch("/api/extra-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Ek iş oluşturulamadı");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-works"] });
      toast({ title: "Ek iş eklendi" });
      setIsDialogOpen(false);
      reset();
    },
    onError: () => {
      toast({ title: "Hata", description: "Ek iş eklenemedi", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ExtraWorkFormData & { id: string }) => {
      const res = await fetch(`/api/extra-work/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Ek iş güncellenemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-works"] });
      toast({ title: "Ek iş güncellendi" });
      setIsDialogOpen(false);
      setEditingItem(null);
      reset();
    },
    onError: () => {
      toast({ title: "Hata", description: "Ek iş güncellenemedi", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/extra-work/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Ek iş silinemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-works"] });
      toast({ title: "Ek iş silindi" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Hata", description: "Ek iş silinemedi", variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/extra-work/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (!res.ok) throw new Error("Onaylanamadı");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-works"] });
      toast({ title: "Ek iş onaylandı" });
    },
    onError: () => {
      toast({ title: "Hata", description: "Ek iş onaylanamadı", variant: "destructive" });
    },
  });

  const isAdmin = session?.user?.role === "ADMIN";

  const onSubmit = (data: ExtraWorkFormData) => {
    if (editingItem) {
      updateMutation.mutate({ ...data, id: editingItem.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: ExtraWork) => {
    setEditingItem(item);
    setValue("tarih", item.tarih.split("T")[0]);
    setValue("aciklama", item.aciklama);
    setValue("fiyat", item.fiyat);
    setValue("fabrikaFiyati", item.fabrikaFiyati || undefined);
    setValue("supplierId", item.supplier.id);
    setValue("vehicleId", item.vehicle.id);
    setValue("projectId", item.project.id);
    setIsDialogOpen(true);
  };

  const handleOpenDialog = () => {
    setEditingItem(null);
    reset();
    setIsDialogOpen(true);
  };

  const totalFiyat = extraWorks?.reduce((sum, item) => sum + item.fiyat, 0) || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        {/* Card skeleton */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <div className="text-right space-y-1">
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-6 w-24 ml-auto" />
            </div>
          </div>
          {/* Table skeleton */}
          <div className="space-y-3">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Ek İş / Mesai"
        description="Ek iş ve mesai kayıtlarını yönetin"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Ek İş
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Ek İş Düzenle" : "Yeni Ek İş Ekle"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Proje *</Label>
                  <Select
                    value={watch("projectId")}
                    onValueChange={(value) => setValue("projectId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Proje seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.ad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.projectId && (
                    <p className="text-sm text-red-500">{errors.projectId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Tedarikçi *</Label>
                  <Select
                    value={watch("supplierId")}
                    onValueChange={(value) => {
                      setValue("supplierId", value);
                      setValue("vehicleId", ""); // Reset vehicle when supplier changes
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tedarikçi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.firmaAdi}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.supplierId && (
                    <p className="text-sm text-red-500">{errors.supplierId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Plaka *</Label>
                  <Select
                    value={watch("vehicleId")}
                    onValueChange={(value) => setValue("vehicleId", value)}
                    disabled={!selectedSupplierId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedSupplierId ? "Plaka seçin" : "Önce tedarikçi seçin"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.plaka}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.vehicleId && (
                    <p className="text-sm text-red-500">{errors.vehicleId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tarih">Tarih *</Label>
                  <Input
                    id="tarih"
                    type="date"
                    {...register("tarih")}
                  />
                  {errors.tarih && (
                    <p className="text-sm text-red-500">{errors.tarih.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aciklama">Açıklama / Güzergah *</Label>
                  <Input
                    id="aciklama"
                    {...register("aciklama")}
                    placeholder="Örn: Kadıköy - Kartal ek sefer"
                  />
                  {errors.aciklama && (
                    <p className="text-sm text-red-500">{errors.aciklama.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fiyat">Tedarikçi Fiyatı (₺) *</Label>
                  <Input
                    id="fiyat"
                    type="number"
                    step="0.01"
                    {...register("fiyat")}
                    placeholder="0.00"
                  />
                  {errors.fiyat && (
                    <p className="text-sm text-red-500">{errors.fiyat.message}</p>
                  )}
                </div>

                {/* Fabrika Fiyatı - Sadece Admin görebilir */}
                {canEditFactory && (
                  <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Factory className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Fabrika Fiyatı (Gizli)</span>
                    </div>
                    <Label htmlFor="fabrikaFiyati">Fabrika Fiyatı (₺)</Label>
                    <Input
                      id="fabrikaFiyati"
                      type="number"
                      step="0.01"
                      {...register("fabrikaFiyati")}
                      placeholder="0.00"
                      className="bg-card"
                    />
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Boş bırakılırsa tedarikçi fiyatı kullanılır.
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Kaydediliyor..."
                      : editingItem
                      ? "Güncelle"
                      : "Ekle"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingItem(null);
                      reset();
                    }}
                  >
                    İptal
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ek İş Listesi</CardTitle>
            <div className="text-right">
              <p className="text-sm text-slate-500">Toplam</p>
              <p className="text-xl font-bold">{formatCurrency(totalFiyat)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {extraWorks && extraWorks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Proje</TableHead>
                  <TableHead>Tedarikçi</TableHead>
                  <TableHead>Plaka</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="text-right">Tedarikçi Fiyatı</TableHead>
                  {showFactoryPrice && (
                    <TableHead className="text-right">Fabrika Fiyatı</TableHead>
                  )}
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-[120px]">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extraWorks.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(new Date(item.tarih))}</TableCell>
                    <TableCell>{item.project.ad}</TableCell>
                    <TableCell>{item.supplier.firmaAdi}</TableCell>
                    <TableCell>{item.vehicle.plaka}</TableCell>
                    <TableCell>{item.aciklama}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.fiyat)}
                    </TableCell>
                    {showFactoryPrice && (
                      <TableCell className="text-right font-medium text-amber-600">
                        {item.fabrikaFiyati ? formatCurrency(item.fabrikaFiyati) : "-"}
                      </TableCell>
                    )}
                    <TableCell>
                      {(item.status ?? "APPROVED") === "APPROVED" ? (
                        <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          Onaylandı
                          {item.approvedAt && (
                            <span className="text-muted-foreground text-xs">
                              ({formatDate(new Date(item.approvedAt))})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 text-sm">Onay Bekliyor</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(item.status ?? "APPROVED") === "PENDING_APPROVAL" && isAdmin && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => approveMutation.mutate(item.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Onayla
                          </Button>
                        )}
                        {(isAdmin || (item.status ?? "APPROVED") === "PENDING_APPROVAL") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-500">
              Henüz ek iş kaydı bulunmuyor
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ek işi silmek istiyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Ek iş kaydı kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
