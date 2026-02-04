import { z } from "zod";

export const documentSchema = z.object({
  ownerType: z.enum(["VEHICLE", "DRIVER"]),
  ownerId: z.string().min(1, "Sahip ID zorunludur"),
  docType: z.string().min(1, "Evrak türü zorunludur"),
  title: z.string().min(1, "Başlık zorunludur"),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
});

export type DocumentFormData = z.infer<typeof documentSchema>;

export const vehicleDocTypes = [
  { value: "RUHSAT", label: "Ruhsat" },
  { value: "SIGORTA", label: "Sigorta" },
  { value: "MUAYENE", label: "Muayene" },
  { value: "KASKO", label: "Kasko" },
  { value: "DIGER", label: "Diğer" },
];

export const driverDocTypes = [
  { value: "EHLIYET", label: "Ehliyet" },
  { value: "SRC", label: "SRC" },
  { value: "PSIKOTEKNIK", label: "Psikoteknik" },
  { value: "ADLI_SICIL", label: "Adli Sicil" },
  { value: "IKAMETGAH", label: "İkametgah" },
  { value: "DIGER", label: "Diğer" },
];
