import { z } from "zod";

export const projectSchema = z.object({
  ad: z.string().min(1, "Proje adı zorunludur"),
  aciklama: z.string().optional(),
  baslangicTarihi: z.string().optional(),
  bitisTarihi: z.string().optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
