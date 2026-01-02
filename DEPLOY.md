# 🚀 UZHAN - Canlıya Alma Rehberi

## Render.com ile Deploy (Ücretsiz ve Kolay)

### 1. GitHub'a Yükleme

```bash
# Git repository oluştur
git init
git add .
git commit -m "Initial commit"
git branch -M main

# GitHub'da yeni repository oluştur, sonra:
git remote add origin https://github.com/KULLANICI_ADI/uzhan.git
git push -u origin main
```

### 2. Backend Deploy (Render)

1. **Render.com**'a git: https://render.com
2. **New +** > **Web Service** seç
3. GitHub repository'ni bağla
4. Ayarlar:
   - **Name**: `uzhan-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. **Environment Variables** ekle:
   ```
   DATABASE_URL=sqlite:///./uzhan.db
   SECRET_KEY=uzhan-secret-key-production-change-this-12345
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```
6. **Create Web Service** tıkla

### 3. Frontend Deploy (Render veya Vercel)

#### Render ile:
1. **New +** > **Static Site** seç
2. GitHub repository'ni bağla
3. Ayarlar:
   - **Name**: `uzhan-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. **Create Static Site** tıkla

#### Vercel ile (Daha Kolay):
1. **Vercel.com**'a git: https://vercel.com
2. **New Project** > GitHub repository'ni seç
3. Ayarlar:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables** ekle (gerekirse):
   ```
   VITE_API_URL=https://uzhan-backend.onrender.com
   ```
5. **Deploy** tıkla

### 4. Frontend API URL'ini Güncelle

Backend URL'i aldıktan sonra (örn: `https://uzhan-backend.onrender.com`):

**frontend/vite.config.ts** dosyasını güncelle:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://uzhan-backend.onrender.com', // Backend URL'iniz
        changeOrigin: true,
      },
    },
  },
})
```

**frontend/src/api/axios.ts** dosyasını güncelle:
```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api', // Production'da backend URL
  headers: {
    'Content-Type': 'application/json',
  },
})
```

### 5. CORS Ayarları

Backend'de CORS zaten ayarlı (`allow_origins=["*"]`), ancak production'da frontend URL'ini ekleyin:

**backend/app/main.py**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://uzhan-frontend.onrender.com",  # Frontend URL'iniz
        "http://localhost:3000",  # Development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Alternatif: Railway (Tek Platform)

Railway hem frontend hem backend için kullanılabilir:

1. **Railway.app**'e git: https://railway.app
2. **New Project** > **Deploy from GitHub repo**
3. Backend için:
   - Root: `backend`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Frontend için:
   - Root: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview` (veya nginx)

## Hızlı Test için: ngrok (Local)

Eğer sadece hızlıca göstermek istiyorsanız:

```bash
# Backend terminalinde
ngrok http 8000

# Frontend terminalinde
ngrok http 3000
```

ngrok size public URL verir, ama sadece bilgisayarınız açıkken çalışır.

## Önemli Notlar

- Render ücretsiz tier'da uyku moduna girer (15 dakika kullanılmazsa)
- İlk açılış 30-60 saniye sürebilir
- Production'da SQLite yerine PostgreSQL kullanmak daha iyi olur
- SECRET_KEY'i mutlaka değiştirin!

