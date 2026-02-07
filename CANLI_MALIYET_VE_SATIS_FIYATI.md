# Uzhan Servis Yönetim Sistemi – Canlı Maliyet ve Satış Fiyatı Önerisi

## Altyapı Özeti (Projenin Kullandığı Servisler)

| Servis | Kullanım |
|--------|----------|
| **Vercel** | Next.js hosting, CI/CD |
| **Neon** | PostgreSQL veritabanı |
| **Vercel Blob** | Evrak/doküman depolama |
| **Upstash Redis** | Rate limiting (login koruması) |

---

## 🔥 EN UCUZ MALİYET – Sunucu Tarafı Seçenekleri

### Seçenek A: SIFIR MALİYET (0 TL/ay)

*Mevcut proje yapısı ile değişiklik gerektirmez – sadece ücretsiz planlara geç.*

| Servis | Ücretsiz Plan | Not |
|--------|---------------|-----|
| **Vercel Hobby** | $0 | Next.js hosting, otomatik deploy |
| **Neon Free** | $0 | 0.5 GB PostgreSQL, 100 CU-saat/ay |
| **Upstash Free** | $0 | 500K komut/ay – rate limiting |
| **Vercel Blob** | $0 | Hobby ile 1 GB dahil |

**Toplam: 0 TL/ay**

- ✅ Küçük işletme (0–10 araç) için yeterli  
- ⚠️ Neon: compute saatleri dolunca uygulama yavaşlayabilir  
- ⚠️ Evrak sayısı çok artarsa Blob limiti aşılabilir  

---

### Seçenek B: TEK VPS (En ucuz ücretli – ~100–150 TL/ay)

*Her şey tek sunucuda: Next.js + PostgreSQL + dosya depolama.*

| Sağlayıcı | Fiyat | Spec | TL (yaklaşık) |
|-----------|-------|------|---------------|
| **Hetzner** | €3.79/ay | 2 vCPU, 4 GB RAM, 40 GB SSD | ~130 TL |
| **DigitalOcean** | $6/ay | 1 vCPU, 1 GB RAM | ~210 TL |
| **Contabo** | €4.99/ay | 4 vCPU, 8 GB RAM | ~175 TL |

**Öneri: Hetzner CX22** – 4 GB RAM, 40 GB SSD, 20 TB trafik dahil.

- Docker ile Next.js + PostgreSQL + dosya depolama tek makinede  
- Domain + SSL (Let's Encrypt) ücretsiz  
- Tek fatura, sınırsız depolama (disk dolana kadar)  
- **Toplam: ~130 TL/ay (~1.560 TL/yıl)**  

---

### Seçenek C: Oracle Cloud Always Free (Süresiz 0 TL)

*Her zaman ücretsiz, kredi kartı gerekir (ücret çekilmez).*

- **4 ARM vCPU + 24 GB RAM** (veya 2 AMD VM)
- 200 GB block storage
- 10 TB aylık trafik

**Yapılması gerekenler:**
- Oracle Cloud hesabı aç
- VM oluştur (Ubuntu)
- Docker ile: Next.js + PostgreSQL + nginx kur
- Port forwarding, firewall ayarları

- ✅ Kalıcı ücretsiz  
- ⚠️ Kurulum ve bakım senin üzerinde  
- ⚠️ Oracle arayüzü karışık, ilk kurulum 1–2 saat sürebilir  

---

### Seçenek D: Hibrit (Hosting ücretsiz, DB ücretli – ~100 TL/ay)

*Uygulama ücretsiz, sadece veritabanı ücretli.*

| Bileşen | Seçenek | Maliyet |
|---------|---------|---------|
| Hosting | Vercel Hobby | $0 |
| Veritabanı | Neon Launch (min. kullanım) | ~$5–10/ay (~175–350 TL) |
| Depolama | Vercel Blob (Hobby 1 GB) | $0 |
| Redis | Upstash Free | $0 |

**Toplam: ~175–350 TL/ay** – VPS’ten pahalı, ama sıfır sunucu yönetimi.

---

### Karşılaştırma Özeti

| Seçenek | Aylık | Senelik | Zorluk | Önerilen kullanım |
|---------|-------|---------|--------|-------------------|
| **A – Tamamen ücretsiz** | 0 TL | 0 TL | Kolay | Küçük işletme, demo, MVP |
| **B – Hetzner VPS** | ~130 TL | ~1.560 TL | Orta | En iyi fiyat/performans |
| **C – Oracle Free** | 0 TL | 0 TL | Zor | Teknik bilgisi olan, uzun vadeli |
| **D – Hibrit** | ~175–350 TL | ~2.100–4.200 TL | Kolay | Sunucu yönetmek istemeyenler |

---

## 📋 Hetzner VPS Kullandığında – Maliyet Tablosu ve Satış Fiyatı

*CPX32 paketi (4 vCPU, 8 GB RAM, 160 GB SSD) varsayılmıştır.*

### Aylık / Senelik Maliyet Tablosu

| Kalem | Aylık (€) | Aylık (TL)* | Senelik (TL)* |
|-------|-----------|-------------|---------------|
| **Hetzner CPX32** | €10.99 | ~385 TL | ~4.620 TL |
| **Domain** (.com.tr / .com) | – | ~15 TL/ay (ortalama) | ~150–250 TL |
| **SSL** (Let's Encrypt) | €0 | 0 TL | 0 TL |
| **Upstash Redis** (opsiyonel) | $0 | 0 TL | 0 TL |
| **Ek servis** | – | 0 TL | 0 TL |
| **TOPLAM** | **€10.99** | **~400 TL/ay** | **~4.800–4.900 TL/yıl** |

*TL kuru ~35 €/TL varsayılmıştır.*

> ✅ Vercel, Neon, Blob kullanılmıyor – hepsi tek sunucuda. Ek fatura yok.

---

### Satış Fiyatı – Hetzner ile Sunduğunda

**Müşteriye ne sunuyorsun?**
- Hazır ERP yazılımı (proje)
- Hetzner VPS kurulumu (Docker / manuel)
- Domain bağlama + SSL
- İlk veri girişi / eğitim (isteğe bağlı)

| Paket | İçerik | Önerilen Satış Fiyatı (TL) |
|-------|--------|----------------------------|
| **Temel** | Kaynak kod + Hetzner’a kurulum + 1 ay destek | **18.000 – 25.000 TL** |
| **Standart** | Temel + domain alımı + 3 ay destek + eğitim | **25.000 – 35.000 TL** |
| **Premium** | Standart + 6 ay destek + özelleştirme | **35.000 – 50.000 TL** |

---

### Neden Bu Fiyatlar?

| Faktör | Açıklama |
|--------|----------|
| **Yazılım değeri** | 2–4 ay geliştirme ≈ 100.000+ TL emek |
| **Kurulum** | VPS setup, domain, SSL ≈ 1–2 gün iş |
| **Rekabet** | Benzer ERP’ler 20.000 – 80.000 TL aralığında |
| **Müşteri maliyeti** | Kendi sunucu maliyeti ~400 TL/ay (~4.800 TL/yıl) |

---

### Kar / Marj Özeti (Hetzner Senaryosu)

| Senaryo | Satış | Tahmini Maliyet (ilk yıl) | Brüt kar |
|---------|-------|---------------------------|----------|
| Temel paket | 20.000 TL | ~5.000 TL (sunucu + domain + zaman) | ~15.000 TL |
| Standart paket | 30.000 TL | ~6.000 TL | ~24.000 TL |
| Premium paket | 42.000 TL | ~8.000 TL | ~34.000 TL |

*Müşteri sunucuyu kendisi ödüyor; sen sadece kurulum ve yazılımı satıyorsun.*

---

### Özet – Hetzner ile Satış Stratejisi

1. **Sunucu:** Müşteri Hetzner CPX32 alır (~385 TL/ay) veya sen alırsın, aylık hosting ücreti olarak ekstra fatura edersin.
2. **Lisans / Kurulum:** 18.000 – 35.000 TL aralığında teklif ver.
3. **Yıllık bakım:** Fiyatın %10–15’i (örn. 2.500 – 5.000 TL/yıl).
4. **Hosting yönetimi:** Sen yönetirsen +500–750 TL/ay ek gelir.

**Pratik hedef:** **25.000 – 35.000 TL** satış + yıllık bakım ile başla.

---

## 🏢 TAM HİZMET MODELİ – Müşterinin Yazılımcısı Yok, Her Şey Sende

*Satacağın firmalarda IT/yazılımcı yok – hosting, bakım, güncelleme, destek hepsi senin üzerinde.*

### Senin Üstleneceğin İşler

| İş | Sıklık | Tahmini süre |
|----|--------|--------------|
| Sunucu kurulumu | İlk seferde | 2–4 saat |
| Domain + SSL ayarı | İlk seferde | ~30 dk |
| Yedekleme (otomatik script) | Günlük/haftalık | Kurulumda 1 saat |
| Güncelleme (Node, paketler, güvenlik) | Aylık | 1–2 saat/müşteri |
| Sorun giderme (hata, yavaşlık) | İhtiyaç halinde | Değişken |
| Küçük değişiklik / rapor isteği | İstek üzerine | Değişken |
| Teknik destek (telefon/WhatsApp) | Sürekli | Değişken |

---

### Maliyet – Müşteri Başına (Hetzner CPX32)

| Kalem | Aylık | Senelik |
|-------|-------|---------|
| Hetzner CPX32 | ~385 TL | ~4.620 TL |
| Domain (ortalama) | ~15 TL | ~180 TL |
| **Toplam altyapı** | **~400 TL** | **~4.800 TL** |

> Her müşteri için ayrı VPS önerilir (veri izolasyonu, güvenlik, sorun yönetimi kolaylığı).

---

### Önerilen Fiyatlandırma – Tam Hizmet

**Model: Tek seferlik kurulum + aylık abonelik**

| Kalem | Tutar | Açıklama |
|-------|-------|----------|
| **Kurulum bedeli** | **15.000 – 25.000 TL** | Tek seferlik – yazılım + sunucu kurulumu + ilk ay destek |
| **Aylık abonelik** | **750 – 1.250 TL/ay** | Sunucu + domain + bakım + destek dahil |

**Aylık aboneliğe dahil olanlar:**
- Hetzner sunucu maliyeti (~400 TL)
- Domain yenileme
- SSL sertifikası
- Yedekleme
- Güncellemeler
- E-posta / WhatsApp ile destek (makul süre)
- Küçük hata düzeltmeleri

---

### Gelir Örneği (5 Müşteri)

| Kalem | Tutar |
|-------|-------|
| Kurulum (5 × 20.000 TL) | 100.000 TL (ilk yıl) |
| Aylık abonelik (5 × 1.000 TL × 12) | 60.000 TL/yıl |
| **Toplam ilk yıl** | **~160.000 TL** |

| Gider (5 müşteri) | Tutar |
|-------------------|-------|
| Sunucu + domain (5 × 400 × 12) | ~24.000 TL |
| **Brüt kar (yaklaşık)** | **~136.000 TL** |

*Bakım ve destek için ayda müşteri başı ~5–10 saat ayırman gerekebilir.*

---

### Basitleştirilmiş Paketler

| Paket | Kurulum | Aylık | Kim için? |
|-------|---------|-------|-----------|
| **Başlangıç** | 15.000 TL | 750 TL | 0–15 araç, az kullanım |
| **Standart** | 20.000 TL | 1.000 TL | 15–40 araç, normal kullanım |
| **İşletme** | 25.000 TL | 1.250 TL | 40+ araç, yoğun kullanım |

---

### Dikkat Edilecekler

1. **Sözleşme:** Aylık iptal koşullarını (örn. 3 ay önceden) net yaz.
2. **SLA:** “Çalışma süresi %99” gibi vaatlerden kaçın; “makul sürede müdahale” gibi ifadeler kullan.
3. **Ek iş:** Büyük özelleştirme / yeni modül = ayrı ücret, önceden belirt.
4. **Yedekleme:** Otomatik yedek script’i kur, müşteriye “yedek alınıyor” bilgisi ver.
5. **Ölçek:** Müşteri sayısı 10+ olunca bakımı otomatikleştir veya part-time destek al.

---

### Özet – Tam Hizmet Modeli

| Öğe | Değer |
|-----|-------|
| **Kurulum** | 15.000 – 25.000 TL (tek sefer) |
| **Aylık abonelik** | 750 – 1.250 TL (sunucu + bakım + destek dahil) |
| **Hedef marj** | Aylık ~350–850 TL/müşteri (altyapı sonrası) |
| **5 müşteri ile yıllık brüt** | ~100.000 – 140.000 TL |

**Tek cümle:** Kurulum 20.000 TL + 1.000 TL/ay ile başla; müşteri artınca oranları gözden geçir.

---

## Senaryo 1: BAŞLANGIÇ / KÜÇÜK İŞLETME (0–10 araç)

*Tüm servisler ücretsiz katmanlar ile çalışır.*

| Servis | Plan | Aylık | Senelik |
|--------|------|-------|---------|
| Vercel | Hobby (ücretsiz) | $0 | $0 |
| Neon | Free tier (0.5 GB, 100 CU-saat/proje) | $0 | $0 |
| Upstash Redis | Free (500K komut/ay) | $0 | $0 |
| Vercel Blob | Hobby dahil (1 GB depolama) | $0 | $0 |

**Toplam:** **0 TL/ay** | **0 TL/yıl**

> ⚠️ Sınırlar: Neon free tier aylık ~100 saat compute, 0.5 GB depolama. Küçük işletme için yeterli. Büyüdükçe Neon ücretli plana geçilir.

---

## Senaryo 2: ÖNERİLEN – ORTA ÖLÇEK (10–50 araç)

*Profesyonel kullanım, daha fazla depolama ve güvenilirlik.*

| Servis | Plan | Aylık (USD) | Senelik (USD) | TL (~35 kur) |
|--------|------|-------------|---------------|--------------|
| Vercel | Pro | $20 + kullanım | $240+ | ~8.400 TL |
| Neon | Launch (ihtiyaca göre) | ~$10–25 | ~$120–300 | ~4.200–10.500 TL |
| Upstash Redis | Free veya pay-as-you-go | $0–5 | $0–60 | ~0–2.100 TL |
| Vercel Blob | Pro dahil + kullanım | ~$0–10 | ~$0–120 | ~0–4.200 TL |

**Toplam (ortalama):** **~$40–60/ay** | **~$480–720/yıl** | **~16.800–25.200 TL/yıl**

---

## Senaryo 3: BÜYÜK İŞLETME (50+ araç, yoğun kullanım)

| Servis | Tahmini Maliyet |
|--------|-----------------|
| Vercel Pro | $20–50/ay |
| Neon Scale | $50–150/ay |
| Upstash | $10–30/ay |
| Vercel Blob | $20–50/ay |

**Toplam:** **~$100–280/ay** | **~35.000–98.000 TL/yıl**

---

## Satış Fiyatı Önerisi

### Projenin Değeri

- **Modüller:** Tedarikçi, şoför, araç, proje, güzergah, puantaj, ek iş, evraklar, raporlar
- **Teknik:** Next.js 14, TypeScript, Prisma, PostgreSQL, NextAuth
- **Özellikler:** Auth, rate limiting, blob storage, PDF üretimi, responsive UI
- **Tahmini geliştirme süresi:** 2–4 ay (tek geliştirici)

### Türkiye Pazarı İçin Öneriler (2025)

| Paket | İçerik | Önerilen Fiyat (TL) |
|-------|--------|----------------------|
| **Temel** | Kaynak kod + kurulum + 1 ay destek | 15.000 – 25.000 |
| **Standart** | Temel + kendi sunucu/veritabanı kurulumu + 3 ay destek | 25.000 – 40.000 |
| **Premium** | Standart + özelleştirmeler + 6 ay destek + eğitim | 40.000 – 60.000 |

### Hesaplama Mantığı

1. **Maliyet karşılığı:** Yıllık altyapı maliyeti × 2–3 yıl = yaklaşık 35.000–75.000 TL (sadece altyapı)
2. **Geliştirme değeri:** Aylık maaş karşılığı (~50.000 TL/ay) × 2–3 ay ≈ 100.000–150.000 TL
3. **Nihai aralık:** 25.000 – 60.000 TL arası makul bir başlangıç fiyatı

### Önerilen Satış Stratejisi

- **İlk 1–2 müşteri:** 15.000–25.000 TL (referans için)
- **Sonraki müşteriler:** 30.000–45.000 TL
- **Yıllık bakım/destek:** Fiyatın %10–15’i (örn. 3.000–6.000 TL/yıl)
- **Hosting yönetimi (opsiyonel):** +500–1.000 TL/ay

---

## Özet Tablo

| Kalem | Aylık (Küçük) | Aylık (Orta) | Senelik (Orta) |
|-------|---------------|--------------|----------------|
| Hosting + DB + Depolama | 0 TL | ~1.500–2.500 TL | ~18.000–30.000 TL |
| **Önerilen satış fiyatı** | – | – | **25.000 – 50.000 TL** (tek seferlik) |

---

## Canlıya Alma Checklist

- [ ] Vercel projesi oluştur, GitHub bağla
- [ ] Neon PostgreSQL oluştur, `DATABASE_URL` ve `DIRECT_DATABASE_URL` ekle
- [ ] Vercel env: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ALLOW_REGISTRATION`
- [ ] (Opsiyonel) Upstash Redis, Vercel Blob token
- [ ] `ALLOW_REGISTRATION=false` (şirket kullanımı için)
- [ ] Seed sonrası admin şifresini değiştir
- [ ] SSL ve domain Vercel üzerinden otomatik

---

*Son güncelleme: Şubat 2025*
