# 🔧 Render Deploy Sorunu Çözümü

## Sorun
Render'da `pydantic-core` Rust ile derlenmeye çalışıyor ve hata veriyor.

## Çözüm 1: Render Dashboard'da Manuel Ayarlar

1. **Render Dashboard**'a gidin: https://dashboard.render.com
2. **Service'inizi** seçin (uzhan-backend)
3. **Settings** sekmesine gidin
4. **Build Command**'ı şu şekilde değiştirin:
   ```
   pip install --upgrade pip setuptools wheel && pip install --prefer-binary -r requirements.txt
   ```
5. **Python Version**'ı **3.11.9** olarak seçin
6. **Save Changes** tıklayın
7. **Manual Deploy** → **Deploy latest commit** tıklayın

## Çözüm 2: Alternatif - Daha Eski Pydantic Versiyonu

Eğer hala çalışmazsa, `backend/requirements.txt` dosyasını şu şekilde güncelleyin:

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
bcrypt==4.0.1
python-multipart==0.0.6
pydantic==2.4.2
pydantic-settings==2.0.3
email-validator==2.0.0
```

Sonra:
```bash
git add backend/requirements.txt
git commit -m "Downgrade pydantic to 2.4.2 for Render compatibility"
git push
```

## Çözüm 3: Railway Kullan (Alternatif Platform)

Render sorun çıkarıyorsa, Railway kullanabilirsiniz:

1. https://railway.app → **New Project** → **Deploy from GitHub repo**
2. Repository'yi seçin
3. Backend için:
   - **Root Directory**: `backend`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Environment Variables ekleyin (Settings → Variables)

Railway genellikle daha az sorun çıkarır.

