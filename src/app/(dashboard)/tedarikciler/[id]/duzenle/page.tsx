"use client";

import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplierSchema, SupplierFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

async function fetchSupplier(id: string) {
  const res = await fetch(`/api/suppliers/${id}`);
  if (!res.ok) throw new Error("Tedarikçi bulunamadı");
  return res.json();
}

async function updateSupplier(id: string, data: SupplierFormData) {
  const res = await fetch(`/api/suppliers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Tedarikçi güncellenemedi");
  return res.json();
}

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: supplier, isLoading } = useQuery({
    queryKey: ["supplier", id],
    queryFn: () => fetchSupplier(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
  });

  useEffect(() => {
    if (supplier) {
      reset({
        firmaAdi: supplier.firmaAdi,
        vergiNo: supplier.vergiNo || "",
        vergiDairesi: supplier.vergiDairesi || "",
        telefon: supplier.telefon || "",
        email: supplier.email || "",
        adres: supplier.adres || "",
      });
    }
  }, [supplier, reset]);

  const mutation = useMutation({
    mutationFn: (data: SupplierFormData) => updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["supplier", id] });
      toast({ title: "Tedarikçi güncellendi" });
      router.push(`/tedarikciler/${id}`);
    },
    onError: () => {
      toast({ title: "Hata", description: "Tedarikçi güncellenemedi", variant: "destructive" });
    },
  });

  const onSubmit = (data: SupplierFormData) => {
    mutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/tedarikciler/${id}`}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tedarikçi Düzenle</h1>
          <p className="text-slate-500">{supplier?.firmaAdi}</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Tedarikçi Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firmaAdi">Firma Adı *</Label>
              <Input id="firmaAdi" {...register("firmaAdi")} />
              {errors.firmaAdi && (
                <p className="text-sm text-red-500">{errors.firmaAdi.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vergiNo">Vergi No</Label>
                <Input id="vergiNo" {...register("vergiNo")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vergiDairesi">Vergi Dairesi</Label>
                <Input id="vergiDairesi" {...register("vergiDairesi")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefon">Telefon</Label>
                <Input id="telefon" {...register("telefon")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adres">Adres</Label>
              <Textarea id="adres" {...register("adres")} />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                {mutation.isPending ? "Kaydediliyor..." : "Güncelle"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/tedarikciler/${id}`}>İptal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
