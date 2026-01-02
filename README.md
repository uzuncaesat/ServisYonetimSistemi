# 🚀 UZHAN

Servis taşımacılığı firmaları için puantaj, sefer ve hakediş yönetimi sistemi.

## 🏗️ Teknolojiler

### Backend
- FastAPI
- SQLite (Docker gerektirmez)
- SQLAlchemy
- JWT Authentication
- Swagger (OpenAPI)

### Frontend
- React + TypeScript
- Vite
- TailwindCSS
- Dark Theme (default)

## 🚀 Kurulum ve Çalıştırma

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend: http://localhost:8000
Swagger: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000

## 🔐 Varsayılan Kullanıcı

İlk kullanıcıyı `/auth/register` endpoint'i ile oluşturabilirsiniz.

## 📋 Özellikler

- ✅ Proje bazlı çalışma
- ✅ Araç yönetimi
- ✅ Sürücü yönetimi
- ✅ Güzergah yönetimi
- ✅ Güzergah fiyatlandırma (araç tipine göre)
- ✅ Sefer takibi
- ✅ Aylık raporlama
- ✅ JWT Authentication

