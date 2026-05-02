import { z } from "zod";

export const fuelTypes = [
  { value: "MOTORIN", label: "Motorin (Dizel)" },
  { value: "BENZIN", label: "Benzin" },
  { value: "LPG", label: "LPG" },
  { value: "ELEKTRIK", label: "Elektrik" },
] as const;

export const fuelSchema = z
  .object({
    vehicleId: z.string().min(1, "Araç seçimi zorunludur"),
    tarih: z.string().min(1, "Tarih zorunludur"),
    yakitTipi: z.enum(["MOTORIN", "BENZIN", "LPG", "ELEKTRIK"]),
    litre: z.coerce.number().positive("Litre 0'dan büyük olmalı"),
    birimFiyat: z.coerce.number().positive("Birim fiyat 0'dan büyük olmalı"),
    toplamTutar: z.coerce.number().positive("Toplam tutar 0'dan büyük olmalı"),
    km: z.coerce.number().int().min(0, "Km 0 veya pozitif olmalı"),
    istasyon: z.string().optional().nullable(),
    fisNo: z.string().optional().nullable(),
    fisUrl: z.string().optional().nullable(),
    notlar: z.string().optional().nullable(),
  })
  .refine(
    (d) => Math.abs(d.litre * d.birimFiyat - d.toplamTutar) < 1,
    {
      message: "Litre × birim fiyat, toplam tutar ile uyuşmuyor (1 TL toleransla)",
      path: ["toplamTutar"],
    }
  );

export type FuelFormData = z.infer<typeof fuelSchema>;
