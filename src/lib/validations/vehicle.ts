import { z } from "zod";

export const vehicleSchema = z.object({
  plaka: z.string().min(1, "Plaka zorunludur").toUpperCase(),
  marka: z.string().optional(),
  model: z.string().optional(),
  kisiSayisi: z.coerce.number().int().min(1).optional(),
  supplierId: z.string().min(1, "Tedarikçi seçimi zorunludur"),
  driverId: z.string().optional().nullable(),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
