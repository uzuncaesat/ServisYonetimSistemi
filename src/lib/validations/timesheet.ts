import { z } from "zod";

export const timesheetSchema = z.object({
  projectId: z.string().min(1, "Proje seçimi zorunludur"),
  vehicleId: z.string().min(1, "Araç seçimi zorunludur"),
  yil: z.coerce.number().int().min(2020).max(2100),
  ay: z.coerce.number().int().min(1).max(12),
});

export type TimesheetFormData = z.infer<typeof timesheetSchema>;

export const timesheetEntrySchema = z.object({
  tarih: z.string(),
  routeId: z.string(),
  seferSayisi: z.coerce.number().int().min(0),
});

export type TimesheetEntryFormData = z.infer<typeof timesheetEntrySchema>;
