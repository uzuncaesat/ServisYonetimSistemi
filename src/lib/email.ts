/**
 * E-posta gönderim modülü
 * Resend API kullanır (free tier: 3000 email/ay, 100 email/gün)
 *
 * KURULUM:
 * 1. resend.com'dan hesap aç
 * 2. API key al (Dashboard > API Keys)
 * 3. .env'ye RESEND_API_KEY=re_xxxxx ekle
 * 4. Vercel'de: Project Settings > Environment Variables > RESEND_API_KEY ekle
 *
 * ÖNEMLİ - onboarding@resend.dev kısıtlaması:
 * Varsayılan "onboarding@resend.dev" ile sadece Resend hesabına KAYITLI e-posta adresine
 * mail gidebilir. Herhangi bir adrese göndermek için:
 * - Resend Dashboard > Domains > Kendi domain'ini ekle (örn. uzhanerp.com)
 * - DNS'te SPF ve DKIM kayıtlarını doğrula
 * - .env'ye RESEND_FROM_EMAIL="UZHAN <bildirim@uzhanerp.com>" ekle
 */

interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  error?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    const msg = "RESEND_API_KEY tanımlı değil - .env ve Vercel ortam değişkenlerini kontrol edin.";
    console.warn("[Email]", msg);
    return { success: false, error: msg };
  }

  const from = process.env.RESEND_FROM_EMAIL || "UZHAN ERP <onboarding@resend.dev>";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = (data as { message?: string }).message || JSON.stringify(data);
      console.error("[Email] Resend API hatası:", response.status, errMsg);
      return { success: false, error: errMsg };
    }

    return { success: true };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[Email] Gönderim hatası:", errMsg);
    return { success: false, error: errMsg };
  }
}

// E-posta şablonları

export function documentExpiryEmailHtml(
  docTitle: string,
  ownerInfo: string,
  daysRemaining: number,
  validTo: string
): string {
  const urgency = daysRemaining <= 7 ? "#dc2626" : daysRemaining <= 15 ? "#d97706" : "#2563eb";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 20px;">UZHAN ERP</h1>
        <p style="margin: 4px 0 0; opacity: 0.8; font-size: 13px;">Evrak Süresi Uyarısı</p>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
        <div style="background-color: ${urgency}15; border-left: 4px solid ${urgency}; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
          <p style="margin: 0; color: ${urgency}; font-weight: 600; font-size: 16px;">
            ${daysRemaining} gün kaldı!
          </p>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Evrak:</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${docTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Sahip:</td>
            <td style="padding: 8px 0; font-size: 14px;">${ownerInfo}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Son Geçerlilik:</td>
            <td style="padding: 8px 0; font-weight: 600; color: ${urgency}; font-size: 14px;">${validTo}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; color: #64748b; font-size: 13px;">
          Lütfen evrakın yenilenmesi için gerekli işlemleri başlatın.
        </p>
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 16px;">
        Bu e-posta UZHAN ERP tarafından otomatik olarak gönderilmiştir.
      </p>
    </div>
  `;
}

export function reportReadyEmailHtml(
  supplierName: string,
  period: string,
  reportType: string
): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 20px;">UZHAN ERP</h1>
        <p style="margin: 4px 0 0; opacity: 0.8; font-size: 13px;">Rapor Bildirimi</p>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
        <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
          <p style="margin: 0; color: #1d4ed8; font-weight: 600; font-size: 16px;">
            Raporunuz hazır!
          </p>
        </div>
        <p style="font-size: 14px; color: #334155;">Merhaba <strong>${supplierName}</strong>,</p>
        <p style="font-size: 14px; color: #334155;">
          <strong>${period}</strong> dönemi <strong>${reportType}</strong> raporunuz hazırlanmıştır.
        </p>
        <p style="font-size: 14px; color: #334155;">
          Raporunuzu görüntülemek için lütfen UZHAN ERP portalına giriş yapın.
        </p>
        <p style="margin-top: 20px; color: #64748b; font-size: 13px;">
          Sorularınız için yöneticinizle iletişime geçebilirsiniz.
        </p>
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 16px;">
        Bu e-posta UZHAN ERP tarafından otomatik olarak gönderilmiştir.
      </p>
    </div>
  `;
}
