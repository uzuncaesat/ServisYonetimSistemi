"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Mail, Lock, Loader2, UserPlus } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 animate-gradient" />
      
      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl animate-float animation-delay-300" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-indigo-400/15 rounded-full blur-2xl animate-float-slow animation-delay-500" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-scale-in">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-6 animate-pulse-glow">
              <Truck className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2 animate-fade-in-up">
              UZHAN ERP
            </h1>
            <p className="text-blue-100 text-sm animate-fade-in-up animation-delay-100">
              Milenyum Lite - Servis Taşımacılığı Yönetim Sistemi
            </p>
          </div>

          {/* Form */}
          <div className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2 animate-fade-in-up animation-delay-200">
                <Label htmlFor="email" className="text-white/90 text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@uzhanerp.com"
                    required
                    className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 focus:border-white/40 transition-all duration-300 rounded-xl"
                  />
                </div>
              </div>
              
              <div className="space-y-2 animate-fade-in-up animation-delay-300">
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
                    className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 focus:border-white/40 transition-all duration-300 rounded-xl"
                  />
                </div>
              </div>

              {success && (
                <div className="animate-fade-in bg-green-500/20 border border-green-400/30 text-green-100 text-sm text-center py-3 px-4 rounded-xl">
                  {success}
                </div>
              )}

              {error && (
                <div className="animate-fade-in bg-red-500/20 border border-red-400/30 text-red-100 text-sm text-center py-3 px-4 rounded-xl">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-white text-indigo-700 hover:bg-white/90 font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-white/20 animate-fade-in-up animation-delay-400"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  "Giriş Yap"
                )}
              </Button>
            </form>

            {/* Register link */}
            <div className="mt-6 text-center animate-fade-in-up animation-delay-500">
              <Link 
                href="/register"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors duration-300"
              >
                <UserPlus className="w-4 h-4" />
                Hesabınız yok mu? Kayıt olun
              </Link>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-white/50 text-xs mt-6 animate-fade-in animation-delay-600">
          © 2024 Uzhan ERP. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
