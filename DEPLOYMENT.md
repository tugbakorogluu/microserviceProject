# 🚀 Dağıtım Rehberi (Production Deployment)

## Yerel Ortam Setup'ı (Local Development)

### Sistem Gereksinimleri

- Docker ve Docker Compose (v20.10+)
- Node.js (v18+)
- npm (v9+)
- Git
- curl (API testleri için)

### Kurulum Adımları

1. **Repository'yi klonla**

```bash
git clone <repository-url>
cd microserviceProject
```

2. **Docker container'larını başlat**

```bash
docker-compose up -d
```

3. **Tüm servisleri başlat**

```bash
chmod +x start.sh cleanup.sh test-api.sh
./start.sh
```

4. **Tarayıcıda aç**

- Dashboard: http://localhost:3000
- RabbitMQ Admin: http://localhost:15672

---

## Docker Deployment

### Docker Image'larını Oluştur

#### Package Service

```bash
cd package-service
docker build -t package-service:1.0.0 .
```

#### Tracking Service

```bash
cd ../tracking-service
docker build -t tracking-service:1.0.0 .
```

#### Notification Service

```bash
cd ../notification-service
docker build -t notification-service:1.0.0 .
```

#### Dashboard

```bash
cd ../dashboard
docker build -t dashboard:1.0.0 .
```

### Docker Compose Production File

Aşağıdaki `docker-compose.prod.yml` dosyasını oluşturun:

```yaml
version: "3.8"

services:
  # Production RabbitMQ
  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    container_name: prod_rabbitmq
    restart: always
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq_prod_data:/var/lib/rabbitmq
    healthcheck:
      test: rabbitmq-diagnostics ping
      interval: 10s
      timeout: 5s
      retries: 5

  # Production MongoDB Services
  mongo_package:
    image: mongo:7.0-alpine
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongo_package_prod:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  # Microservices
  package-service:
    image: package-service:1.0.0
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3001
      MONGODB_URI: ${PACKAGE_SERVICE_MONGODB_URI}
      RABBITMQ_HOST: rabbitmq
    depends_on:
      rabbitmq:
        condition: service_healthy
    healthcheck:
      test: curl -f http://localhost:3001/packages/health/check || exit 1
      interval: 30s
      timeout: 10s
      retries: 3

  tracking-service:
    image: tracking-service:1.0.0
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3002
      MONGODB_URI: ${TRACKING_SERVICE_MONGODB_URI}
      RABBITMQ_HOST: rabbitmq
    depends_on:
      rabbitmq:
        condition: service_healthy
    healthcheck:
      test: curl -f http://localhost:3002/trackings/health/check || exit 1
      interval: 30s
      timeout: 10s
      retries: 3

  notification-service:
    image: notification-service:1.0.0
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3003
      MONGODB_URI: ${NOTIFICATION_SERVICE_MONGODB_URI}
      RABBITMQ_HOST: rabbitmq
    depends_on:
      rabbitmq:
        condition: service_healthy
    healthcheck:
      test: curl -f http://localhost:3003/notifications/health/check || exit 1
      interval: 30s
      timeout: 10s
      retries: 3

  dashboard:
    image: dashboard:1.0.0
    restart: always
    environment:
      NEXT_PUBLIC_PACKAGE_SERVICE_URL: http://package-service:3001
      NEXT_PUBLIC_TRACKING_SERVICE_URL: http://tracking-service:3002
      NEXT_PUBLIC_NOTIFICATION_SERVICE_URL: http://notification-service:3003
    ports:
      - "3000:3000"

volumes:
  rabbitmq_prod_data:
  mongo_package_prod:
```

---

## Kubernetes Deployment

### Namespace Oluştur

```bash
kubectl create namespace smart-tracking
```

### ConfigMap ve Secrets

```bash
# ConfigMap
kubectl create configmap smart-tracking-config \
  --from-literal=RABBITMQ_HOST=rabbitmq \
  --from-literal=NODE_ENV=production \
  -n smart-tracking

# Secrets
kubectl create secret generic smart-tracking-secrets \
  --from-literal=MONGODB_PASSWORD=<password> \
  --from-literal=RABBITMQ_PASSWORD=<password> \
  -n smart-tracking
```

### Deployment YAML Örneği

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: package-service
  namespace: smart-tracking
spec:
  replicas: 3
  selector:
    matchLabels:
      app: package-service
  template:
    metadata:
      labels:
        app: package-service
    spec:
      containers:
        - name: package-service
          image: package-service:1.0.0
          ports:
            - containerPort: 3001
          env:
            - name: NODE_ENV
              value: "production"
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: smart-tracking-secrets
                  key: MONGODB_URI
            - name: RABBITMQ_HOST
              valueFrom:
                configMapKeyRef:
                  name: smart-tracking-config
                  key: RABBITMQ_HOST
          livenessProbe:
            httpGet:
              path: /packages/health/check
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /packages/health/check
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"

---
apiVersion: v1
kind: Service
metadata:
  name: package-service
  namespace: smart-tracking
spec:
  selector:
    app: package-service
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3001
  type: LoadBalancer
```

---

## CI/CD Pipeline (GitHub Actions Örneği)

```yaml
name: Deploy Smart Tracking System

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies (Package Service)
        run: |
          cd package-service
          npm install

      - name: Build (Package Service)
        run: |
          cd package-service
          npm run build

      - name: Lint (Package Service)
        run: |
          cd package-service
          npm run lint

      # Repeat for other services...

      - name: Build Docker images
        run: |
          docker build -t package-service:${{ github.sha }} ./package-service
          docker build -t tracking-service:${{ github.sha }} ./tracking-service
          docker build -t notification-service:${{ github.sha }} ./notification-service
          docker build -t dashboard:${{ github.sha }} ./dashboard

      - name: Push to Registry
        run: |
          # Docker Hub veya özel registry'ye push et
          docker push package-service:${{ github.sha }}
          # ...
```

---

## Monitoring ve Logging

### Prometheus Metrics

RabbitMQ ve Node.js uygulamalarından metrikleri toplamak için:

```bash
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v /etc/prometheus:/etc/prometheus \
  prom/prometheus
```

### Grafana Dashboards

```bash
docker run -d \
  --name grafana \
  -p 3001:3000 \
  grafana/grafana
```

### ELK Stack (Elasticsearch, Logstash, Kibana)

```bash
docker-compose -f elk-stack.yml up -d
```

---

## Backup ve Recovery

### MongoDB Backup

```bash
# Package Service
mongodump --uri="mongodb://user:pass@localhost:27017/package_db" --out=/backup/package_db

# Restore
mongorestore --uri="mongodb://user:pass@localhost:27017" /backup/package_db
```

### RabbitMQ Backup

```bash
# Definitions'ı dışa aktar
rabbitmqctl export_definitions backup.json

# Restore
rabbitmqctl import_definitions backup.json
```

---

## Güvenlik

### SSL/TLS Ayarları

```bash
# Self-signed certificate oluştur
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt

# Kubernetes secret oluştur
kubectl create secret tls smart-tracking-tls \
  --cert=tls.crt --key=tls.key \
  -n smart-tracking
```

### Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: smart-tracking-network-policy
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: smart-tracking
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: smart-tracking
```

---

## Performance Tuning

### Node.js Optimizasyonları

```bash
# Cluster mode ile başlat
NODE_ENV=production node --max-old-space-size=4096 dist/main.js
```

### MongoDB Indexing

```javascript
// Package Service
db.packages.createIndex({ barcode: 1 }, { unique: true });
db.packages.createIndex({ createdAt: 1 });

// Tracking Service
db.trackings.createIndex({ barcode: 1 }, { unique: true });
db.trackings.createIndex({ currentStatus: 1 });

// Notification Service
db.notifications.createIndex({ barcode: 1 });
db.notifications.createIndex({ sentAt: 1 });
```

### RabbitMQ Tuning

```bash
# Memory alokasyonu
rabbitmqctl set_vm_memory_high_watermark 0.6

# Channel max
rabbitmqctl eval 'application:set_env(rabbit, channel_max, 2048).'
```

---

## Troubleshooting

### Servisler başlatılmıyor

```bash
# Logları kontrol et
docker-compose logs -f service-name

# Health check'i manual test et
curl -v http://localhost:3001/packages/health/check
```

### RabbitMQ bağlantı hatası

```bash
# RabbitMQ durumunu kontrol et
docker-compose ps rabbitmq

# Admin UI'ye erişebilir misin?
curl http://localhost:15672/api/overview
```

### Database bağlantı hatası

```bash
# MongoDB'ye bağlan
mongo mongodb://root:rootpassword@localhost:27017/package_db?authSource=admin

# Veritabanını kontrol et
use package_db
db.packages.find()
```

---

## Rollback Stratejisi

```bash
# Önceki version'a geri dön
docker-compose pull
docker-compose down
docker-compose up -d

# Kubernetes'te
kubectl rollout undo deployment/package-service -n smart-tracking
```

---

**Notlar:**

- Tüm passwordları production'da güvenli kaynaklardan al
- Rate limiting ve authentication ekle
- API documentation'u Swagger ile oluştur
- Cost optimization'u AWS/Azure/GCP ile yap
