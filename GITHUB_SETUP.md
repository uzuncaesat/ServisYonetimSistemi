# 📦 GitHub'a Yükleme Adımları

## 1️⃣ GitHub'da Repository Oluştur

1. **GitHub'a giriş yap**: https://github.com
2. **Yeni repository oluştur**:
   - Sağ üstteki **+** butonuna tıkla
   - **New repository** seç
3. **Repository ayarları**:
   - **Repository name**: `uzhan` (veya istediğiniz isim)
   - **Description**: "Servis taşımacılığı yönetim sistemi"
   - **Public** veya **Private** seçin
   - ⚠️ **"Initialize this repository with a README" İŞARETLEMEYİN**
   - **"Add .gitignore"** seçmeyin (zaten var)
   - **"Choose a license"** opsiyonel
4. **"Create repository"** butonuna tıkla

## 2️⃣ Terminal Komutları

Aşağıdaki komutları **sırayla** çalıştırın:

### Adım 1: Remote Repository'yi Bağla

```powershell
git remote add origin https://github.com/KULLANICI_ADINIZ/uzhan.git
```

**⚠️ ÖNEMLİ**: `KULLANICI_ADINIZ` yerine GitHub kullanıcı adınızı yazın!

Örnek:
```powershell
git remote add origin https://github.com/esatberat/uzhan.git
```

### Adım 2: GitHub'a Yükle

```powershell
git push -u origin main
```

GitHub kullanıcı adı ve şifre (veya Personal Access Token) isteyecek.

## 3️⃣ Eğer Hata Alırsanız

### "remote origin already exists" hatası:
```powershell
git remote remove origin
git remote add origin https://github.com/KULLANICI_ADINIZ/uzhan.git
```

### Authentication hatası:
GitHub artık şifre kabul etmiyor. **Personal Access Token** kullanmanız gerekiyor:

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. **Generate new token** → **Generate new token (classic)**
3. **Note**: "UZHAN Project"
4. **Expiration**: 90 days (veya istediğiniz süre)
5. **Scopes**: `repo` işaretle
6. **Generate token** → Token'ı kopyala
7. `git push` yaparken şifre yerine bu token'ı kullanın

## 4️⃣ Başarılı Olduğunda

GitHub repository sayfanızda tüm dosyaları göreceksiniz!

Repository URL'iniz: `https://github.com/KULLANICI_ADINIZ/uzhan`

## 5️⃣ Sonraki Adımlar (Deploy için)

Repository'yi oluşturduktan sonra `DEPLOY.md` dosyasındaki adımları takip ederek canlıya alabilirsiniz.

