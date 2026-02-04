import { z } from "zod";

export const supplierSchema = z.object({
  firmaAdi: z.string().min(1, "Firma adı zorunludur"),
  vergiNo: z.string().optional(),
  vergiDairesi: z.string().optional(),
  telefon: z.string().optional(),
  email: z.string().email("Geçerli bir email giriniz").optional().or(z.literal("")),
  adres: z.string().optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;
