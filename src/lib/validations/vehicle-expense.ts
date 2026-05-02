import { z } from "zod";

export const expenseCategories = [
  { value: "BAKIM", label: "Bakım" },
  { value: "SIGORTA", label: "Sigorta" },
  { value: "KASKO", label: "Kasko" },
  { value: "VERGI", label: "Motorlu Taşıt Vergisi" },
  { value: "MUAYENE", label: "Muayene" },
  { value: "LASTIK", label: "Lastik" },
  { value: "HASAR", label: "Hasar / Tamir" },
  { value: "CEZA", label: "Trafik Cezası" },
  { value: "OTOPARK", label: "Otopark / Köprü" },
  { value: "KOLTUK_SIGORTASI", label: "Koltuk Sigortası" },
  { value: "CALISMA_RUHSATI", label: "Çalışma Ruhsatı" },
  { value: "DIGER", label: "Diğer" },
] as const;

export const expenseCategoryValues = expenseCategories.map((c) => c.value) as [
  string,
  ...string[],
];

export const vehicleExpenseSchema = z.object({
  vehicleId: z.string().min(1, "Araç seçimi zorunludur"),
  tarih: z.string().min(1, "Tarih zorunludur"),
  kategori: z.enum(expenseCategoryValues),
  altKategori: z.string().optional().nullable(),
  tutar: z.coerce.number().positive("Tutar 0'dan büyük olmalı"),
  kdvDahil: z.boolean().default(true),
  km: z.coerce.number().int().min(0).optional().nullable(),
  saglayici: z.string().optional().nullable(),
  belgeNo: z.string().optional().nullable(),
  garantiBitis: z.union([z.string(), z.literal(""), z.null()]).optional(),
  notlar: z.string().optional().nullable(),
  fisUrl: z.string().optional().nullable(),
});

export type VehicleExpenseFormData = z.infer<typeof vehicleExpenseSchema>;
