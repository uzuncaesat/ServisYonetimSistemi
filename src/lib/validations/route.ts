import { z } from "zod";

export const routeSchema = z.object({
  ad: z.string().min(1, "Güzergah adı zorunludur"),
  baslangicNoktasi: z.string().optional(),
  bitisNoktasi: z.string().optional(),
  km: z.coerce.number().min(0).optional(),
  birimFiyat: z.coerce.number().min(0, "Birim fiyat 0'dan büyük olmalıdır"),
  fabrikaFiyati: z.coerce.number().min(0).optional().nullable(),
  kdvOrani: z.coerce.number().min(0).max(100).default(20),
  projectId: z.string().min(1, "Proje seçimi zorunludur"),
});

export type RouteFormData = z.infer<typeof routeSchema>;
