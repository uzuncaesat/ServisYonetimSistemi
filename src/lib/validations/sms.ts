import { z } from "zod";

export const smsSendSchema = z.object({
  recipients: z
    .array(
      z.object({
        to: z.string().min(7, "Geçerli telefon numarası girin"),
        aliciAdi: z.string().optional().nullable(),
      })
    )
    .min(1, "En az bir alıcı eklemelisiniz")
    .max(500, "Tek seferde en fazla 500 alıcıya gönderilebilir"),
  message: z
    .string()
    .min(1, "Mesaj boş olamaz")
    .max(800, "Mesaj 800 karakteri aşamaz"),
  sender: z.string().optional(),
  tetikleyici: z.string().optional(),
});

export type SmsSendData = z.infer<typeof smsSendSchema>;
