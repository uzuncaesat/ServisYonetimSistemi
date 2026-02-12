"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Truck,
  Building2,
  Mail,
  Lock,
  User,
  Globe,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

type Step = "company" | "user" | "verify";

export default function CompanyRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("company");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Company info
  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");

  // User info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // Verify
  const [verificationCode, setVerificationCode] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[çÇ]/g, "c")
      .replace(/[ğĞ]/g, "g")
      .replace(/[ıİ]/g, "i")
      .replace(/[öÖ]/g, "o")
      .replace(/[şŞ]/g, "s")
      .replace(/[üÜ]/g, "u")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleCompanyNameChange = (value: string) => {
    setCompanyName(value);
    if (!slug || slug === generateSlug(companyName)) {
      setSlug(generateSlug(value));
    }
  };

  const handleRegister = async () => {
    setError(null);

    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, slug, name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Kayıt başarısız");
        return;
      }

      setRegisteredEmail(email);
      setStep("verify");
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, code: verificationCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Doğrulama başarısız");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    try {
      const res = await fetch("/api/register/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });
      if (res.ok) {
        setError(null);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/30 mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">UZHAN ERP</h1>
          <p className="text-slate-400 mt-1">Firma Kaydı</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[
              { key: "company", label: "Firma" },
              { key: "user", label: "Hesap" },
              { key: "verify", label: "Doğrulama" },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step === s.key
                      ? "bg-blue-500 text-white"
                      : ["company", "user"].indexOf(step) > ["company", "user"].indexOf(s.key as Step)
                      ? "bg-green-500 text-white"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {i + 1}
                </div>
                <span className="ml-2 text-sm text-white/70 hidden sm:inline">{s.label}</span>
                {i < 2 && <div className="flex-1 h-px bg-white/10 mx-2" />}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Company Info */}
          {step === "company" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-white/80">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Firma Adı
                </Label>
                <Input
                  value={companyName}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  placeholder="Örn: ABC Taşımacılık"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">
                  <Globe className="w-4 h-4 inline mr-2" />
                  URL Kısaltması
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    placeholder="abc-tasimacilik"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                  <span className="text-white/40 text-sm whitespace-nowrap">.uzhanerp.com</span>
                </div>
              </div>
              <Button
                onClick={() => setStep("user")}
                disabled={!companyName || !slug}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Devam Et
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: User Info */}
          {step === "user" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-white/80">
                  <User className="w-4 h-4 inline mr-2" />
                  Ad Soyad
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">
                  <Mail className="w-4 h-4 inline mr-2" />
                  E-posta
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@firma.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Şifre
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Şifre Tekrar
                </Label>
                <Input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Şifreyi tekrar girin"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("company")}
                  className="flex-1 border-white/10 text-white hover:bg-white/5"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri
                </Button>
                <Button
                  onClick={handleRegister}
                  disabled={!name || !email || !password || !passwordConfirm || loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {loading ? "Kaydediliyor..." : "Kayıt Ol"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Verification */}
          {step === "verify" && (
            <div className="space-y-5 text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
              <div>
                <h3 className="text-xl font-bold text-white">E-posta Doğrulama</h3>
                <p className="text-white/60 mt-2">
                  <strong className="text-white">{registeredEmail}</strong> adresine 6 haneli doğrulama kodu gönderdik.
                </p>
              </div>
              <div className="space-y-2">
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="bg-white/5 border-white/10 text-white text-center text-2xl tracking-widest placeholder:text-white/30"
                />
              </div>
              <Button
                onClick={handleVerify}
                disabled={verificationCode.length !== 6 || loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {loading ? "Doğrulanıyor..." : "Doğrula ve Giriş Yap"}
              </Button>
              <button
                onClick={handleResendCode}
                className="text-blue-400 hover:text-blue-300 text-sm underline"
              >
                Kodu tekrar gönder
              </button>
            </div>
          )}

          {/* Login link */}
          <div className="text-center mt-6 pt-6 border-t border-white/10">
            <p className="text-white/60 text-sm">
              Zaten hesabınız var mı?{" "}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                Giriş Yap
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
