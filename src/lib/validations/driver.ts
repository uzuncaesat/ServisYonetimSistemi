import { z } from "zod";

export const driverSchema = z.object({
  adSoyad: z.string().min(1, "Ad soyad zorunludur"),
  telefon: z.string().optional(),
  ehliyetSinifi: z.string().optional(),
  email: z.string().email("Geçerli bir email giriniz").optional().or(z.literal("")),
});

export type DriverFormData = z.infer<typeof driverSchema>;
