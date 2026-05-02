// SMS sağlayıcılarının uyması gereken ortak arayüz.
// Yeni provider eklemek için: SmsProvider implement et + factory'ye kaydet.

export interface SendSmsParams {
  to: string; // E.164 formatında: +905551112233 veya 905551112233
  message: string;
  // Provider-spesifik header / sender. Boş bırakılırsa env'den alınır.
  sender?: string;
}

export interface SendSmsResult {
  success: boolean;
  providerId?: string; // Provider'ın döndürdüğü mesaj/iş referansı
  error?: string;
}

export interface SmsProvider {
  readonly name: string; // "NETGSM" | "ILETIMERKEZI" | "CONSOLE"
  send(params: SendSmsParams): Promise<SendSmsResult>;
}

// Türkiye telefon numarası normalizasyonu.
// Girdiyi 905xxxxxxxxx (12 hane, başında +/0 olmadan) hâline çevirir.
// Geçersizse null döner.
export function normalizeTrPhone(input: string): string | null {
  if (!input) return null;
  let n = input.replace(/[^\d+]/g, "");
  if (n.startsWith("+")) n = n.slice(1);
  if (n.startsWith("00")) n = n.slice(2);
  if (n.startsWith("0")) n = n.slice(1);
  // Türkiye için 90 prefix kontrolü
  if (n.length === 10 && n.startsWith("5")) {
    n = "90" + n;
  } else if (n.length === 12 && n.startsWith("90")) {
    // ok
  } else {
    return null;
  }
  // 90 sonrası 5 ile başlamalı (cep)
  if (!n.startsWith("905")) return null;
  return n;
}
