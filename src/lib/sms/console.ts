import { SmsProvider, SendSmsParams, SendSmsResult } from "./types";

// Geliştirme/test ortamı için console-log provider.
// Hiçbir SMS göndermez, sadece sunucu loguna yazar ve başarı döner.
// SMS_PROVIDER env'i tanımlanmadığında default olarak bu kullanılır.
export class ConsoleSmsProvider implements SmsProvider {
  readonly name = "CONSOLE";

  async send(params: SendSmsParams): Promise<SendSmsResult> {
    const stamp = new Date().toISOString();
    console.log(
      `[SMS:CONSOLE ${stamp}] -> ${params.to}\n  ${params.message}\n  (sender: ${
        params.sender ?? "default"
      })`
    );
    return {
      success: true,
      providerId: `console-${Date.now()}`,
    };
  }
}
