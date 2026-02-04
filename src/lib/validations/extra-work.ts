import { z } from "zod";

export const extraWorkSchema = z.object({
  tarih: z.string().or(z.date()),
  aciklama: z.string().min(1, "Açıklama zorunludur"),
  fiyat: z.coerce.number().min(0, "Fiyat 0 veya daha büyük olmalıdır"),
  fabrikaFiyati: z.coerce.number().min(0).optional().nullable(),
  supplierId: z.string().min(1, "Tedarikçi zorunludur"),
  vehicleId: z.string().min(1, "Araç zorunludur"),
  projectId: z.string().min(1, "Proje zorunludur"),
});

export type ExtraWorkFormData = z.infer<typeof extraWorkSchema>;
