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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Factory, CheckCircle, MoreHorizontal, Briefcase } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { canEditFactoryPrice, canViewFactoryPrice } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const columnCount = 8 + (showFactoryPrice ? 1 : 0);
  const hasItems = (extraWorks?.length ?? 0) > 0;

  return (
    <div>
      <PageHeader
        title="Ek İş / Mesai"
        description="Ek iş ve mesai kayıtlarını yönetin"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog}>
                <Plus className="h-4 w-4" />
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
                    <p className="text-xs text-destructive">{errors.projectId.message}</p>
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
                    <p className="text-xs text-destructive">{errors.supplierId.message}</p>
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
                    <p className="text-xs text-destructive">{errors.vehicleId.message}</p>
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
                    <p className="text-xs text-destructive">{errors.tarih.message}</p>
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
                    <p className="text-xs text-destructive">{errors.aciklama.message}</p>
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
                    <p className="text-xs text-destructive">{errors.fiyat.message}</p>
                  )}
                </div>

                {/* Fabrika Fiyatı - Sadece Admin görebilir */}
                {canEditFactory && (
                  <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center gap-2">
                      <Factory className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Fabrika Fiyatı
                      </span>
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        Admin
                      </Badge>
                    </div>
                    <Input
                      id="fabrikaFiyati"
                      type="number"
                      step="0.01"
                      {...register("fabrikaFiyati")}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
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
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle>Ek İş Listesi</CardTitle>
            <CardDescription>Tüm ek iş ve mesai kayıtları.</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Toplam</p>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(totalFiyat)}</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!isLoading && !hasItems ? (
            <EmptyState
              icon={Briefcase}
              title="Henüz ek iş yok"
              description="Ek iş / mesai kaydı oluşturduğunuzda burada listelenir."
              className="m-5"
            />
          ) : (
            <div className="overflow-x-auto">
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
                    <TableHead className="w-[80px] text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeleton columns={columnCount} />
                  ) : (
                    extraWorks?.map((item) => {
                      const status = item.status ?? "APPROVED";
                      const canEditItem = isAdmin || status === "PENDING_APPROVAL";
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-muted-foreground">
                            {formatDate(new Date(item.tarih))}
                          </TableCell>
                          <TableCell className="font-medium">{item.project.ad}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.supplier.firmaAdi}
                          </TableCell>
                          <TableCell>{item.vehicle.plaka}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.aciklama}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.fiyat)}
                          </TableCell>
                          {showFactoryPrice && (
                            <TableCell className="text-right font-medium">
                              {item.fabrikaFiyati ? formatCurrency(item.fabrikaFiyati) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            {status === "APPROVED" ? (
                              <Badge variant="success">
                                <CheckCircle className="h-3 w-3" /> Onaylandı
                              </Badge>
                            ) : (
                              <Badge variant="warning">Onay Bekliyor</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {status === "PENDING_APPROVAL" && isAdmin && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => approveMutation.mutate(item.id)}
                                  disabled={approveMutation.isPending}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Onayla
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {canEditItem && (
                                    <DropdownMenuItem onClick={() => handleEdit(item)}>
                                      <Pencil /> Düzenle
                                    </DropdownMenuItem>
                                  )}
                                  {canEditItem && <DropdownMenuSeparator />}
                                  <DropdownMenuItem
                                    onClick={() => setDeleteId(item.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="text-destructive" /> Sil
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

