"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  vehicleExpenseSchema,
  VehicleExpenseFormData,
  expenseCategories,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

interface Vehicle {
  id: string;
  plaka: string;
  marka: string | null;
  model: string | null;
}

interface ExpenseFormProps {
  vehicles: Vehicle[];
  defaultValues?: Partial<VehicleExpenseFormData>;
  onSubmit: (data: VehicleExpenseFormData) => void;
  isPending: boolean;
  submitLabel: string;
  cancelHref: string;
}

export function ExpenseForm({
  vehicles,
  defaultValues,
  onSubmit,
  isPending,
  submitLabel,
  cancelHref,
}: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VehicleExpenseFormData>({
    resolver: zodResolver(vehicleExpenseSchema),
    defaultValues: {
      tarih: new Date().toISOString().slice(0, 10),
      kategori: "BAKIM",
      kdvDahil: true,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Araç *</Label>
          <Select
            value={watch("vehicleId")}
            onValueChange={(v) => setValue("vehicleId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Araç seçin" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.plaka} — {v.marka ?? ""} {v.model ?? ""}
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
          <Input id="tarih" type="date" {...register("tarih")} />
        </div>

        <div className="space-y-2">
          <Label>Kategori *</Label>
          <Select
            value={watch("kategori")}
            onValueChange={(v) =>
              setValue("kategori", v as VehicleExpenseFormData["kategori"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="altKategori">Alt Kategori / Açıklama</Label>
          <Input
            id="altKategori"
            placeholder="örn. Fren balata, Yağ değişimi"
            {...register("altKategori")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tutar">Tutar (TL) *</Label>
          <Input
            id="tutar"
            type="number"
            step="0.01"
            {...register("tutar")}
          />
          {errors.tutar && (
            <p className="text-xs text-destructive">{errors.tutar.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="km">Km (opsiyonel)</Label>
          <Input id="km" type="number" {...register("km")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="saglayici">Sağlayıcı / Servis</Label>
          <Input
            id="saglayici"
            placeholder="örn. Bosch Servis, Aksigorta"
            {...register("saglayici")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="belgeNo">Belge No</Label>
          <Input
            id="belgeNo"
            placeholder="Fatura/Makbuz numarası"
            {...register("belgeNo")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="garantiBitis">Garanti Bitiş (varsa)</Label>
          <Input
            id="garantiBitis"
            type="date"
            {...register("garantiBitis")}
          />
        </div>

        <div className="space-y-2 flex flex-col justify-end">
          <Label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={watch("kdvDahil")}
              onCheckedChange={(v) => setValue("kdvDahil", v === true)}
            />
            <span>Tutara KDV dahil</span>
          </Label>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notlar">Notlar</Label>
          <Textarea id="notlar" rows={3} {...register("notlar")} />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isSubmitting || isPending}>
          {isPending ? "Kaydediliyor..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={cancelHref}>İptal</Link>
        </Button>
      </div>
    </form>
  );
}
