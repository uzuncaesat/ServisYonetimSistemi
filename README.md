# UZHAN ERP - Milenyum Lite

Personel / Servis Taşımacılığı Yönetim Sistemi

## Özellikler

- **Proje Yönetimi**: Servis projelerini oluşturma ve yönetme
- **Tedarikçi Yönetimi**: Tedarikçi firmalarını kaydetme ve takip etme
- **Araç Yönetimi**: Araç envanteri, tedarikçi ve şoför atamaları
- **Şoför Yönetimi**: Şoför bilgileri ve evrak takibi
- **Güzergah Tanımlama**: Proje bazlı güzergahlar ve fiyatlandırma
- **Puantaj Sistemi**: Excel benzeri aylık sefer girişi ve hesaplama
- **Evrak Yönetimi**: PDF doküman yükleme ve arşivleme
- **Tedarikçi Raporları**: PDF hakediş raporu oluşturma

## Teknoloji Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **UI**: Tailwind CSS + shadcn/ui
- **State**: TanStack Query (React Query)
- **PDF**: pdfmake
- **Validation**: Zod + React Hook Form

## Kurulum

### Gereksinimler

- Node.js 18+
- PostgreSQL 14+
- npm veya yarn

### Adımlar

1. **Repository'yi klonlayın**

```bash
git clone <repository-url>
cd uzhan-erp
```

2. **Bağımlılıkları yükleyin**

```bash
npm install
```

3. **Environment değişkenlerini ayarlayın**

`.env.example` dosyasını `.env` olarak kopyalayın ve düzenleyin:

```bash
cp .env.example .env
```

`.env` dosyası içeriği:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/uzhan_erp?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
```

4. **PostgreSQL veritabanı oluşturun**

```sql
CREATE DATABASE uzhan_erp;
```

5. **Prisma migration çalıştırın**

```bash
npm run db:migrate
```

6. **Örnek verileri yükleyin (opsiyonel)**

```bash
npm run db:seed
```

7. **Uygulamayı başlatın**

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## Varsayılan Giriş Bilgileri

Seed çalıştırıldıktan sonra:

- **Email**: admin@uzhanerp.com
- **Şifre**: admin123

## Proje Yapısı

```
├── prisma/
│   ├── schema.prisma      # Veritabanı şeması
│   └── seed.ts            # Örnek veri scripti
├── src/
│   ├── app/
│   │   ├── (auth)/        # Login sayfası
│   │   ├── (dashboard)/   # Ana dashboard sayfaları
│   │   └── api/           # API routes
│   ├── components/
│   │   ├── ui/            # shadcn/ui bileşenleri
│   │   ├── layout/        # Layout bileşenleri
│   │   └── documents/     # Evrak bileşenleri
│   ├── lib/
│   │   ├── prisma.ts      # Prisma client
│   │   ├── auth.ts        # Auth konfigürasyonu
│   │   ├── utils.ts       # Yardımcı fonksiyonlar
│   │   ├── storage.ts     # Dosya depolama
│   │   └── validations/   # Zod şemaları
│   └── types/             # TypeScript tipleri
└── uploads/               # Yüklenen dosyalar (gitignore)
```

## API Endpoints

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/suppliers` | GET, POST | Tedarikçi listele/ekle |
| `/api/suppliers/[id]` | GET, PUT, DELETE | Tedarikçi detay/güncelle/sil |
| `/api/drivers` | GET, POST | Şoför listele/ekle |
| `/api/drivers/[id]` | GET, PUT, DELETE | Şoför detay/güncelle/sil |
| `/api/vehicles` | GET, POST | Araç listele/ekle |
| `/api/vehicles/[id]` | GET, PUT, DELETE | Araç detay/güncelle/sil |
| `/api/projects` | GET, POST | Proje listele/ekle |
| `/api/projects/[id]` | GET, PUT, DELETE | Proje detay/güncelle/sil |
| `/api/projects/[id]/vehicles` | GET, POST, DELETE | Projeye araç ata/kaldır |
| `/api/routes` | GET, POST | Güzergah listele/ekle |
| `/api/routes/[id]` | GET, PUT, DELETE | Güzergah detay/güncelle/sil |
| `/api/timesheets` | GET, POST | Puantaj listele/oluştur |
| `/api/timesheets/[id]` | GET, DELETE | Puantaj detay/sil |
| `/api/timesheets/[id]/entries` | GET, POST, PUT | Puantaj girişleri |
| `/api/documents/upload` | POST | Evrak yükle |
| `/api/documents` | GET | Evrak listele |
| `/api/documents/[id]/download` | GET | Evrak indir |
| `/api/documents/[id]/preview` | GET | Evrak önizle |
| `/api/documents/[id]` | DELETE | Evrak sil |
| `/api/reports/supplier` | GET | Tedarikçi raporu (PDF) |

## Puantaj Hesaplama Mantığı

```
Satır Net = Sefer Sayısı × Birim Fiyat
Toplam = Tüm Satırların Toplamı
KDV = Toplam × %20
Ara Toplam = Toplam + KDV
Tevkifat (5/10) = KDV × %50
Fatura Tutarı = Ara Toplam - Tevkifat
```

## Geliştirme

```bash
# Development server
npm run dev

# Build
npm run build

# Linting
npm run lint

# Prisma Studio (veritabanı görüntüleme)
npm run db:studio

# Migration oluşturma
npm run db:migrate

# Prisma client oluşturma
npm run db:generate
```

## Notlar

- Puantaj girişlerinde fiyat snapshot olarak kaydedilir (güzergah fiyatı değişse bile eski puantajlar etkilenmez)
- PDF dosyaları `uploads/` klasöründe saklanır (20MB limit)
- S3 uyumlu yapı için storage.ts dosyası adapte edilebilir
- Üretim ortamında `NEXTAUTH_SECRET` değiştirilmelidir

## Lisans

MIT
