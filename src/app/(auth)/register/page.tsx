"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Truck,
  Loader2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "verify">("form");
  const [verifyEmail, setVerifyEmail] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Kayıt işlemi başarısız oldu");
      } else if (data.requiresVerification) {
        setVerifyEmail(data.email);
        setStep("verify");
      } else {
        router.push("/login?registered=true");
      }
    } catch {
      setError("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const code = formData.get("code") as string;

    try {
      const res = await fetch("/api/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Doğrulama başarısız");
      } else {
        router.push("/login?verified=true");
      }
    } catch {
      setError("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/register/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kod gönderilemedi");
      } else {
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch {
      setError("Kod gönderilemedi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="relative hidden lg:flex flex-col justify-between bg-zinc-950 text-zinc-100 p-10 overflow-hidden">
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="bg-spotlight absolute inset-0" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">UZHAN ERP</span>
        </div>

        <div className="relative max-w-md space-y-4">
          <h2 className="text-2xl font-semibold leading-tight tracking-tight">
            Birkaç saniyede hesabınızı oluşturun.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Kayıt olduktan sonra tüm servis operasyonlarınızı yönetmeye
            başlayabilirsiniz. Projeler, araçlar ve puantaj kayıtları tek bir
            panelde.
          </p>
        </div>

        <div className="relative text-xs text-zinc-500">
          © {new Date().getFullYear()} UZHAN ERP. Tüm hakları saklıdır.
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-start gap-2">
            <div className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-2">
              <Truck className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {step === "form" ? "Yeni hesap oluşturun" : "E-postanızı doğrulayın"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === "form"
                ? "Başlamak için aşağıdaki formu doldurun."
                : `${verifyEmail} adresine 6 haneli kod gönderildi.`}
            </p>
          </div>

          {step === "form" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium">
                  Ad Soyad
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Adınız Soyadınız"
                  required
                  autoComplete="name"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  E-posta
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ornek@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium">
                  Şifre
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="En az 6 karakter"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-medium">
                  Şifre tekrar
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              {error ? (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-px" />
                  <span>{error}</span>
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Kayıt yapılıyor…
                  </>
                ) : (
                  <>
                    Kayıt ol <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="code" className="text-xs font-medium">
                  Doğrulama kodu
                </Label>
                <Input
                  id="code"
                  name="code"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="text-center text-lg tracking-[0.4em] font-mono"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                E-posta gelmediyse spam klasörünü kontrol edin veya{" "}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || loading}
                  className="font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-50"
                >
                  {resendCooldown > 0
                    ? `${resendCooldown} sn sonra tekrar gönder`
                    : "kodu tekrar gönderin"}
                </button>
                .
              </p>

              {error ? (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-px" />
                  <span>{error}</span>
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Doğrulanıyor…
                  </>
                ) : (
                  "E-postayı doğrula"
                )}
              </Button>
            </form>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 font-medium text-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Giriş sayfasına dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
