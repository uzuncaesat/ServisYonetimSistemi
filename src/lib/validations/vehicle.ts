import { z } from "zod";

const optionalDate = z
  .union([z.string(), z.null(), z.literal("")])
  .optional()
  .transform((val) => (val === "" || val == null ? null : val));

export const vehicleSchema = z.object({
  plaka: z.string().min(1, "Plaka zorunludur").toUpperCase(),
  marka: z.string().optional(),
  model: z.string().optional(),
  kisiSayisi: z.coerce.number().int().min(1).optional(),
  supplierId: z.string().min(1, "Tedarikçi seçimi zorunludur"),
  driverId: z.string().optional().nullable(),
  ruhsatBitis: optionalDate,
  sigortaBitis: optionalDate,
  muayeneBitis: optionalDate,
  koltukSigortasiBitis: optionalDate,
  calismaRuhsatiBitis: optionalDate,
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
