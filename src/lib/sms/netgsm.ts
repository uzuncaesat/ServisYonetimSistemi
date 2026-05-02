import { SmsProvider, SendSmsParams, SendSmsResult } from "./types";

// Netgsm REST entegrasyonu (HTTP GET tabanlı).
// Doc: https://www.netgsm.com.tr/dokuman/#sms-rest-api-1n1
// Gerekli env değişkenleri:
//   NETGSM_USERCODE  - Netgsm kullanıcı kodu (genelde abone numarası)
//   NETGSM_PASSWORD  - Netgsm API şifresi
//   NETGSM_HEADER    - Onaylı gönderici başlığı (varsayılan sender)

const NETGSM_BASE = "https://api.netgsm.com.tr/sms/rest/v2/send";

export class NetgsmProvider implements SmsProvider {
  readonly name = "NETGSM";

  private usercode: string;
  private password: string;
  private defaultHeader: string;

  constructor(opts?: { usercode?: string; password?: string; header?: string }) {
    this.usercode = opts?.usercode ?? process.env.NETGSM_USERCODE ?? "";
    this.password = opts?.password ?? process.env.NETGSM_PASSWORD ?? "";
    this.defaultHeader = opts?.header ?? process.env.NETGSM_HEADER ?? "";

    if (!this.usercode || !this.password || !this.defaultHeader) {
      console.warn(
        "[SMS:NETGSM] Eksik konfigürasyon. NETGSM_USERCODE, NETGSM_PASSWORD ve NETGSM_HEADER tanımlı olmalı."
      );
    }
  }

  async send(params: SendSmsParams): Promise<SendSmsResult> {
    if (!this.usercode || !this.password) {
      return { success: false, error: "Netgsm konfigürasyonu eksik (usercode/password)." };
    }

    const sender = params.sender || this.defaultHeader;
    if (!sender) {
      return { success: false, error: "Netgsm header (sender) eksik." };
    }

    const body = {
      msgheader: sender,
      messages: [
        {
          msg: params.message,
          no: params.to,
        },
      ],
      encoding: "TR",
      iysfilter: "0", // 1 = IYS filtresi uygulanır (ticari mesaj)
      partnercode: "",
    };

    try {
      const res = await fetch(NETGSM_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + Buffer.from(`${this.usercode}:${this.password}`).toString("base64"),
        },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      if (!res.ok) {
        return { success: false, error: `Netgsm HTTP ${res.status}: ${text}` };
      }

      // Netgsm v2 yanıtı: {"code":"00","description":"OK","jobid":"..."}
      let parsed: { code?: string; jobid?: string; description?: string } | null = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        // Bazı eski endpoint'ler düz metin döner: "00 1234567"
        const parts = text.trim().split(/\s+/);
        if (parts[0] === "00") {
          return { success: true, providerId: parts[1] };
        }
        return { success: false, error: `Netgsm yanıtı: ${text}` };
      }

      if (parsed?.code === "00") {
        return { success: true, providerId: parsed.jobid ?? "" };
      }
      return {
        success: false,
        error: `Netgsm hata kodu ${parsed?.code}: ${parsed?.description ?? ""}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bilinmeyen Netgsm hatası";
      return { success: false, error: message };
    }
  }
}
