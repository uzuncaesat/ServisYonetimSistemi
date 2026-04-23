"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Loader2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Kayıt başarılı. Giriş yapabilirsiniz.");
    }
    if (searchParams.get("verified") === "true") {
      setSuccess("E-postanız doğrulandı. Giriş yapabilirsiniz.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email veya şifre hatalı");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
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
            Servis operasyonlarınızı tek bir panelden yönetin.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Projeler, tedarikçiler, araçlar ve puantaj kayıtları — hepsi tek bir
            sade arayüzde. UZHAN ERP ile operasyonun her ayrıntısı
            parmaklarınızın ucunda.
          </p>
        </div>

        <div className="relative text-xs text-zinc-500">
          © {new Date().getFullYear()} UZHAN ERP. Tüm hakları saklıdır.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-start gap-2">
            <div className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-2">
              <Truck className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Hesabınıza giriş yapın
            </h1>
            <p className="text-sm text-muted-foreground">
              Devam etmek için e-posta ve şifrenizi girin.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium">
                E-posta
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@uzhanerp.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium">
                  Şifre
                </Label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {success ? (
              <div className="flex items-start gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-px" />
                <span>{success}</span>
              </div>
            ) : null}

            {error ? (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-px" />
                <span>{error}</span>
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Giriş yapılıyor…
                </>
              ) : (
                <>
                  Giriş yap <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Hesabınız yok mu?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              Kayıt olun
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center bg-background">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
