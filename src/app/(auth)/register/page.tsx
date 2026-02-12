"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Mail, Lock, User, Loader2, ArrowLeft, KeyRound } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "verify">("form");
  const [verifyEmail, setVerifyEmail] = useState<string>("");

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

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 animate-gradient" />
      
      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl animate-float animation-delay-300" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-cyan-400/15 rounded-full blur-2xl animate-float-slow animation-delay-500" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-scale-in">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-6 animate-pulse-glow">
              <Truck className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2 animate-fade-in-up">
              Kayıt Ol
            </h1>
            <p className="text-emerald-100 text-sm animate-fade-in-up animation-delay-100">
              UZHAN ERP - Milenyum Lite
            </p>
          </div>

          {/* Form / Doğrulama */}
          <div className="px-8 pb-10">
            {step === "form" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 animate-fade-in-up animation-delay-200">
                <Label htmlFor="name" className="text-white/90 text-sm font-medium">
                  Ad Soyad
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Adınız Soyadınız"
                    required
                    className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 focus:border-white/40 transition-all duration-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2 animate-fade-in-up animation-delay-300">
                <Label htmlFor="email" className="text-white/90 text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="ornek@email.com"
                    required
                    className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 focus:border-white/40 transition-all duration-300 rounded-xl"
                  />
                </div>
              </div>
              
              <div className="space-y-2 animate-fade-in-up animation-delay-400">
                <Label htmlFor="password" className="text-white/90 text-sm font-medium">
                  Şifre
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 focus:border-white/40 transition-all duration-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2 animate-fade-in-up animation-delay-500">
                <Label htmlFor="confirmPassword" className="text-white/90 text-sm font-medium">
                  Şifre Tekrar
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 focus:border-white/40 transition-all duration-300 rounded-xl"
                  />
                </div>
              </div>

              {error && (
                <div className="animate-fade-in bg-red-500/20 border border-red-400/30 text-red-100 text-sm text-center py-3 px-4 rounded-xl">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-white text-teal-700 hover:bg-white/90 font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-white/20 animate-fade-in-up animation-delay-600"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Kayıt yapılıyor...
                  </>
                ) : (
                  "Kayıt Ol"
                )}
              </Button>
            </form>
            ) : (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <p className="text-white/90 text-sm text-center mb-2">
                <strong>{verifyEmail}</strong> adresine gönderilen 6 haneli kodu girin.
              </p>
              <div className="space-y-2">
                <Label htmlFor="code" className="text-white/90 text-sm font-medium">
                  Doğrulama Kodu
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 focus:border-white/40 transition-all duration-300 rounded-xl text-center text-xl tracking-[0.5em] font-mono"
                  />
                </div>
              </div>
              {error && (
                <div className="animate-fade-in bg-red-500/20 border border-red-400/30 text-red-100 text-sm text-center py-3 px-4 rounded-xl">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-12 bg-white text-teal-700 hover:bg-white/90 font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-white/20"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Doğrulanıyor...
                  </>
                ) : (
                  "E-postayı Doğrula"
                )}
              </Button>
            </form>
            )}

            {/* Login link */}
            <div className="mt-6 text-center animate-fade-in-up animation-delay-700">
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors duration-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Zaten hesabınız var mı? Giriş yapın
              </Link>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-white/50 text-xs mt-6 animate-fade-in animation-delay-800">
          © 2024 Uzhan ERP. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
