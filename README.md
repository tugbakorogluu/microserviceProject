# 🚚 Akıllı Kargo ve Paket Takip Sistemi

Bu proje, **Event-Driven Architecture** ve **Database-per-Service** prensiplerini kullanarak geliştirilen, **3 bağımsız NestJS mikroservisi** ile oluşturulmuş production-ready bir sistemdir.

## 📋 Proje Yapısı

```
microserviceProject/
├── package-service/        # Kargo Kayıt Masası
├── tracking-service/       # Dağıtım ve Takip Merkezi
├── notification-service/   # Müşteri İletişim Hattı
├── dashboard/             # Web Arayüzü
├── docker-compose.yml     # RabbitMQ ve MongoDB Container'ları
└── README.md
```

---

## 🏗️ Mimari Özellikleri

### 1. **Event-Driven Architecture**

- Servisler arası doğrudan HTTP/REST iletişimi **YASAKLANMIŞTIR**
- Tüm iletişim **RabbitMQ** üzerinden asenkron mesajlaşma ile yapılır
- Mesajlar kuyruklarda birikmektedir, servis çöktüğünde devam ederler

### 2. **Database-per-Service**

Her servisin **kendi bağımsız MongoDB** veritabanı vardır:

- **Package Service**: `package_db`
- **Tracking Service**: `tracking_db`
- **Notification Service**: `notification_db`

### 3. **RabbitMQ Topic Exchanges**

- **package.exchange**: Kargo oluşturma event'leri
- **tracking.exchange**: Teslimat bildirim event'leri

### 4. **Dayanıklılık**

- `durable: true` - Queue'lar kalıcı
- `noAck: false` - Manuel onay (acknowledgment)
- Heartbeat yapılandırması ile bağlantı sağlığı

---

## 🚀 Hızlı Başlangıç

### Adım 1: Docker Container'larını Başlat

```bash
cd /Users/tugbakoroglu/gelistirici/microserviceProject
docker-compose up --build
```

Bu komut şunları başlatır:

- ✅ RabbitMQ (port 5672, Admin: 15672)
- ✅ MongoDB Package Service (port 27017)
- ✅ MongoDB Tracking Service (port 27018)
- ✅ MongoDB Notification Service (port 27019)

### Adım 2: Package Service'i Başlat

```bash
cd package-service
npm install
npm run dev
```

- **Port**: 3001
- **Health Check**: GET http://localhost:3001/packages/health/check

### Adım 3: Tracking Service'i Başlat

```bash
cd ../tracking-service
npm install
npm run dev
```

- **Port**: 3002
- **Health Check**: GET http://localhost:3002/trackings/health/check

### Adım 4: Notification Service'i Başlat

```bash
cd ../notification-service
npm install
npm run dev
```

- **Port**: 3003
- **Health Check**: GET http://localhost:3003/notifications/health/check

### Adım 5: Dashboard'u Başlat

```bash
cd ../dashboard
npm install
npm run dev
```

- **URL**: http://localhost:3000
- Dashboard'ta tüm servisler yönetilebilir

---

## 📦 Servis Detayları

### 1. Package Service (Kargo Kayıt Masası)

**Görev**: Kargo ilk kaydını almak ve benzersiz barkod üretmek

**Endpoints**:

```
POST /packages
Body: { sender: string, receiver: string }
Response: { barcode, sender, receiver, status: "Hazırlanıyor" }

GET /packages
GET /packages/:barcode
GET /packages/health/check
```

**Event Yayını**:

```
Exchange: package.exchange
Routing Key: package.created
Payload: { barcode, sender, receiver, status, createdAt }
```

---

### 2. Tracking Service (Dağıtım Merkezi)

**Görev**: Kargo durum geçişlerini yönetmek ve simüle etmek

**Endpoints**:

```
GET /trackings
GET /trackings/:barcode
GET /trackings/status/:status
GET /trackings/health/check
```

**Event Dinlemesi**:

```
Exchange: package.exchange
Routing Key: package.created
Queue: tracking.package.created.queue
```

**Durum Simülasyonu**:

```
Hazırlanıyor → Yolda → Dağıtımda → Teslim Edildi
(Her aşama 10 saniye)
```

**Event Yayını**:

```
Exchange: tracking.exchange
Routing Key: package.delivered
Payload: { barcode, status: "Teslim Edildi", deliveredAt }
```

---

### 3. Notification Service (Müşteri İletişim)

**Görev**: Teslimat bildirimlerini işlemek ve loglamak

**Endpoints**:

```
GET /notifications
GET /notifications/barcode/:barcode
GET /notifications/status/:status
GET /notifications/stats/all
GET /notifications/health/check
```

**Event Dinlemesi**:

```
Exchange: tracking.exchange
Routing Key: package.delivered
Queue: notification.package.delivered.queue

Konsol Output: 🚨 Sayın Müşteri, [BARKOD] numaralı kargonuz teslim edilmiştir!
```

---

## 📊 Web Dashboard

### Sekmeler:

1. **Dashboard** 📊 - Sistem özeti ve bilgiler
2. **Paketler** 📦 - Yeni paket oluştur ve listele
3. **Takip** 🚚 - Aktif takip bilgileri
4. **Bildirimler** 🔔 - Gönderilen bildirimler ve istatistikler
5. **Servis Durumu** 🏥 - Tüm servisler ve altyapı bilgisi

### Özellikler:

- ✅ Gerçek zamanlı veri güncelleme
- ✅ Statü filtreleme
- ✅ İstatistik görüntüleme
- ✅ Servis sağlık durumu kontrolü

---

## 🧪 Test Senaryosu

### Senaryo: Paket Oluştur ve Takip Et

1. **Dashboard'a gir**: http://localhost:3000
2. **Paketi Oluştur**:
   - Gönderici: "Ali Veli"
   - Alıcı: "Mehmet Turan"
   - Barkod otomatik üretilir

3. **Takip Sekmesinde Gözlemle**:
   - Hazırlanıyor (0-10s)
   - Yolda (10-20s)
   - Dağıtımda (20-30s)
   - Teslim Edildi (30s+)

4. **Bildirimler Sekmesinde Gözlemle**:
   - Teslimat bildirimi otomatik kaydedilir
   - Konsol çıktısında mesaj görünür

---

## 🔧 Environment Ayarları

### Package Service (.env)

```env
PORT=3001
MONGODB_URI=mongodb://root:rootpassword@localhost:27017/package_db?authSource=admin
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
```

### Tracking Service (.env)

```env
PORT=3002
MONGODB_URI=mongodb://root:rootpassword@localhost:27018/tracking_db?authSource=admin
STATUS_SIMULATION_INTERVAL=10000
```

### Notification Service (.env)

```env
PORT=3003
MONGODB_URI=mongodb://root:rootpassword@localhost:27019/notification_db?authSource=admin
```

---

## 📚 RabbitMQ Yönetim UI

**URL**: http://localhost:15672
**Kullanıcı**: guest
**Şifre**: guest

### Kontrol Edebileceğiniz:

- ✅ Exchange'ler (package.exchange, tracking.exchange)
- ✅ Queue'lar (tracking.package.created.queue, notification.package.delivered.queue)
- ✅ Mesaj sayısı ve bağlantılar
- ✅ Performans metrikleri

---

## 💾 MongoDB Erişimi

### Bağlantı Dizileri:

```
Package Service: mongodb://root:rootpassword@localhost:27017/package_db?authSource=admin
Tracking Service: mongodb://root:rootpassword@localhost:27018/tracking_db?authSource=admin
Notification Service: mongodb://root:rootpassword@localhost:27019/notification_db?authSource=admin
```

### MongoDB UI (Compass)

- [Download MongoDB Compass](https://www.mongodb.com/products/compass)
- Her servise ayrı URI ile bağlan

---

## 🐛 Sorun Giderme

### Problem: Servis çalışmıyor

```bash
# Containerları kontrol et
docker-compose ps

# Konteynerları yeniden başlat
docker-compose down
docker-compose up --build
```

### Problem: Port çakışması

```bash
# Portlar değiştir
docker-compose.yml içinde port numaralarını güncelle
```

### Problem: RabbitMQ bağlantı hatası

```bash
# Logs kontrol et
docker-compose logs rabbitmq

# RabbitMQ'yu yeniden başlat
docker-compose restart rabbitmq
```

---

## 📈 Production Dağıtımı

### Hazırlıklar:

1. ✅ Environment değişkenlerini güvenli kaynaklardan al
2. ✅ SSL/TLS bağlantılarını konfigure et
3. ✅ Health checks'i etkinleştir
4. ✅ Logging ve monitoring araçlarını kur
5. ✅ Kubernetes manifests'i hazırla

### Tavsiye Edilen Altyapı:

- **Container Orchestration**: Kubernetes
- **Service Mesh**: Istio
- **Logging**: ELK Stack
- **Monitoring**: Prometheus + Grafana
- **CI/CD**: GitHub Actions / Jenkins

---

## 📝 Notlar

- Tüm DTOs ve Schemas NestJS standartlarına uygun
- Dependency Injection tamamen kullanılıyor
- Validation pipes tüm input'ları kontrol ediyor
- Error handling comprehensive
- Queue dayanıklılığı maksimal

---

## 👨‍💻 Teknoloji Stack

- **Runtime**: Node.js
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: MongoDB + Mongoose
- **Message Broker**: RabbitMQ
- **Frontend**: Next.js + React + TailwindCSS
- **Containerization**: Docker + Docker Compose

---

## 📄 Lisans

MIT License

---

## 📞 Destek

Herhangi bir soru veya sorun için lütfen issues kısmında bildirim yapınız.

---

**Hazırlanma Tarihi**: 19 Mayıs 2026
**Versiyon**: 1.0.0
