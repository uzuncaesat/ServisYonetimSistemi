import { prisma } from "@/lib/prisma";
import { SmsProvider, SendSmsParams, SendSmsResult, normalizeTrPhone } from "./types";
import { ConsoleSmsProvider } from "./console";
import { NetgsmProvider } from "./netgsm";
import { IletimerkeziProvider } from "./iletimerkezi";

export { normalizeTrPhone } from "./types";
export type { SmsProvider, SendSmsParams, SendSmsResult } from "./types";

// Provider factory: SMS_PROVIDER env değişkenine göre uygun sağlayıcıyı döner.
// Geçerli değerler: "NETGSM", "ILETIMERKEZI", "CONSOLE" (varsayılan).
export function getSmsProvider(): SmsProvider {
  const provider = (process.env.SMS_PROVIDER ?? "CONSOLE").toUpperCase();
  switch (provider) {
    case "NETGSM":
      return new NetgsmProvider();
    case "ILETIMERKEZI":
      return new IletimerkeziProvider();
    case "CONSOLE":
    default:
      return new ConsoleSmsProvider();
  }
}

// Yüksek seviye gönderim fonksiyonu:
// - Numarayı normalize eder.
// - Provider'a yollar.
// - Sonucu SmsLog'a yazar.
// - Başarısız ise gönderilmedi diye işaretler ama exception fırlatmaz.
export async function sendSms(opts: {
  to: string;
  aliciAdi?: string | null;
  message: string;
  tetikleyici?: string;
  gonderenId?: string | null;
  organizationId?: string | null;
  sender?: string;
}): Promise<{
  ok: boolean;
  logId: string;
  providerId?: string;
  error?: string;
}> {
  const normalized = normalizeTrPhone(opts.to);
  const provider = getSmsProvider();

  // Önce log kaydını PENDING olarak aç.
  const log = await prisma.smsLog.create({
    data: {
      alici: normalized ?? opts.to,
      aliciAdi: opts.aliciAdi ?? null,
      mesaj: opts.message,
      durum: "PENDING",
      saglayici: provider.name,
      tetikleyici: opts.tetikleyici ?? "MANUAL",
      gonderenId: opts.gonderenId ?? null,
      organizationId: opts.organizationId ?? null,
    },
  });

  if (!normalized) {
    await prisma.smsLog.update({
      where: { id: log.id },
      data: { durum: "FAILED", hata: "Geçersiz telefon numarası" },
    });
    return { ok: false, logId: log.id, error: "Geçersiz telefon numarası" };
  }

  let result: SendSmsResult;
  try {
    result = await provider.send({
      to: normalized,
      message: opts.message,
      sender: opts.sender,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Provider exception";
    await prisma.smsLog.update({
      where: { id: log.id },
      data: { durum: "FAILED", hata: message },
    });
    return { ok: false, logId: log.id, error: message };
  }

  if (result.success) {
    await prisma.smsLog.update({
      where: { id: log.id },
      data: { durum: "SENT", saglayiciId: result.providerId ?? null, hata: null },
    });
    return { ok: true, logId: log.id, providerId: result.providerId };
  }

  await prisma.smsLog.update({
    where: { id: log.id },
    data: { durum: "FAILED", hata: result.error ?? "Bilinmeyen hata" },
  });
  return { ok: false, logId: log.id, error: result.error };
}

// Aynı mesajı birden fazla numaraya yollar; her biri ayrı log oluşturur.
export async function sendSmsBulk(opts: {
  recipients: { to: string; aliciAdi?: string | null }[];
  message: string;
  tetikleyici?: string;
  gonderenId?: string | null;
  organizationId?: string | null;
  sender?: string;
}): Promise<{
  total: number;
  sent: number;
  failed: number;
  results: Array<{ to: string; ok: boolean; error?: string; logId: string }>;
}> {
  const results: Array<{ to: string; ok: boolean; error?: string; logId: string }> = [];
  let sent = 0;
  let failed = 0;

  for (const r of opts.recipients) {
    const res = await sendSms({
      to: r.to,
      aliciAdi: r.aliciAdi ?? null,
      message: opts.message,
      tetikleyici: opts.tetikleyici,
      gonderenId: opts.gonderenId,
      organizationId: opts.organizationId,
      sender: opts.sender,
    });
    if (res.ok) sent++;
    else failed++;
    results.push({ to: r.to, ok: res.ok, error: res.error, logId: res.logId });
  }

  return { total: opts.recipients.length, sent, failed, results };
}
