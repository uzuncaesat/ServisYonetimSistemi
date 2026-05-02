import { SmsProvider, SendSmsParams, SendSmsResult } from "./types";

// İletimerkezi REST entegrasyonu (JSON POST).
// Doc: https://www.iletimerkezi.com/api/v1/
// Gerekli env değişkenleri:
//   ILETIMERKEZI_USERNAME
//   ILETIMERKEZI_PASSWORD
//   ILETIMERKEZI_SENDER  - Onaylı gönderici başlığı

const ILETIMERKEZI_BASE = "https://api.iletimerkezi.com/v1/send-sms/json";

export class IletimerkeziProvider implements SmsProvider {
  readonly name = "ILETIMERKEZI";

  private username: string;
  private password: string;
  private sender: string;

  constructor(opts?: { username?: string; password?: string; sender?: string }) {
    this.username = opts?.username ?? process.env.ILETIMERKEZI_USERNAME ?? "";
    this.password = opts?.password ?? process.env.ILETIMERKEZI_PASSWORD ?? "";
    this.sender = opts?.sender ?? process.env.ILETIMERKEZI_SENDER ?? "";

    if (!this.username || !this.password || !this.sender) {
      console.warn(
        "[SMS:ILETIMERKEZI] Eksik konfigürasyon. ILETIMERKEZI_USERNAME, ILETIMERKEZI_PASSWORD ve ILETIMERKEZI_SENDER tanımlı olmalı."
      );
    }
  }

  async send(params: SendSmsParams): Promise<SendSmsResult> {
    if (!this.username || !this.password) {
      return { success: false, error: "İletimerkezi konfigürasyonu eksik." };
    }

    const sender = params.sender || this.sender;
    if (!sender) {
      return { success: false, error: "İletimerkezi sender eksik." };
    }

    const payload = {
      request: {
        authentication: {
          username: this.username,
          password: this.password,
        },
        order: {
          sender,
          sendDateTime: [],
          message: {
            text: params.message,
            receipents: { number: [params.to] },
          },
        },
      },
    };

    try {
      const res = await fetch(ILETIMERKEZI_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        return { success: false, error: `İletimerkezi HTTP ${res.status}: ${text}` };
      }

      let parsed: {
        response?: { status?: { code?: string | number; message?: string }; order?: { id?: string } };
      };
      try {
        parsed = JSON.parse(text);
      } catch {
        return { success: false, error: `İletimerkezi parse hatası: ${text}` };
      }

      const code = parsed.response?.status?.code;
      const ok = code === 200 || code === "200";
      if (ok) {
        return { success: true, providerId: parsed.response?.order?.id ?? "" };
      }
      return {
        success: false,
        error: `İletimerkezi kod ${code}: ${parsed.response?.status?.message ?? ""}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bilinmeyen İletimerkezi hatası";
      return { success: false, error: message };
    }
  }
}
