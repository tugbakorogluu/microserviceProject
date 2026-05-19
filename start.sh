#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}🚀 Akıllı Kargo Sistemi Başlatıcısı${NC}"
echo -e "${BLUE}================================${NC}\n"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker yüklü değil. Lütfen Docker'ı yükleyiniz.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose yüklü değil. Lütfen Docker Compose'u yükleyiniz.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js yüklü değil. Lütfen Node.js'i yükleyiniz.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm yüklü değil. Lütfen npm'i yükleyiniz.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Tüm gereklilikler kontrol edildi${NC}\n"

# Start Docker Compose services
echo -e "${YELLOW}📦 Docker container'ları başlatılıyor...${NC}"
docker-compose up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker container'ları başarıyla başlatıldı${NC}\n"
else
    echo -e "${RED}❌ Docker container'ları başlatılamadı${NC}"
    exit 1
fi

# Wait for MongoDB and RabbitMQ to be ready
echo -e "${YELLOW}⏳ Servisler hazırlanıyor (15 saniye bekliyorum)...${NC}"
sleep 15

# Function to check and install dependencies
install_dependencies() {
    local dir=$1
    local service_name=$2
    
    echo -e "${YELLOW}📥 $service_name bağımlılıkları yükleniyor...${NC}"
    cd "$dir"
    
    if [ ! -d "node_modules" ]; then
        npm install
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ $service_name bağımlılıkları yüklendi${NC}"
        else
            echo -e "${RED}❌ $service_name bağımlılıkları yüklenemedi${NC}"
            return 1
        fi
    else
        echo -e "${GREEN}✅ $service_name bağımlılıkları zaten yüklü${NC}"
    fi
    
    cd - > /dev/null
    return 0
}

# Get the current directory
PROJECT_DIR=$(pwd)

# Install dependencies for all services
install_dependencies "$PROJECT_DIR/package-service" "Package Service"
if [ $? -ne 0 ]; then exit 1; fi

install_dependencies "$PROJECT_DIR/tracking-service" "Tracking Service"
if [ $? -ne 0 ]; then exit 1; fi

install_dependencies "$PROJECT_DIR/notification-service" "Notification Service"
if [ $? -ne 0 ]; then exit 1; fi

install_dependencies "$PROJECT_DIR/dashboard" "Dashboard"
if [ $? -ne 0 ]; then exit 1; fi

echo -e "\n${BLUE}================================${NC}"
echo -e "${BLUE}📊 Servis Başlatma Bilgileri${NC}"
echo -e "${BLUE}================================${NC}\n"

# Start services in background
echo -e "${YELLOW}🚀 Mikroservisler başlatılıyor...${NC}\n"

# Start Package Service
echo -e "${BLUE}📦 Package Service başlatılıyor (Port 3001)...${NC}"
cd "$PROJECT_DIR/package-service"
npm run dev > /tmp/package-service.log 2>&1 &
PACKAGE_PID=$!
echo -e "${GREEN}✅ Package Service PID: $PACKAGE_PID${NC}\n"

# Start Tracking Service
echo -e "${BLUE}🚚 Tracking Service başlatılıyor (Port 3002)...${NC}"
cd "$PROJECT_DIR/tracking-service"
npm run dev > /tmp/tracking-service.log 2>&1 &
TRACKING_PID=$!
echo -e "${GREEN}✅ Tracking Service PID: $TRACKING_PID${NC}\n"

# Start Notification Service
echo -e "${BLUE}🔔 Notification Service başlatılıyor (Port 3003)...${NC}"
cd "$PROJECT_DIR/notification-service"
npm run dev > /tmp/notification-service.log 2>&1 &
NOTIFICATION_PID=$!
echo -e "${GREEN}✅ Notification Service PID: $NOTIFICATION_PID${NC}\n"

# Start Dashboard
echo -e "${BLUE}📊 Dashboard başlatılıyor (Port 3000)...${NC}"
cd "$PROJECT_DIR/dashboard"
npm run dev > /tmp/dashboard.log 2>&1 &
DASHBOARD_PID=$!
echo -e "${GREEN}✅ Dashboard PID: $DASHBOARD_PID${NC}\n"

# Wait for services to start
echo -e "${YELLOW}⏳ Servisler başlatılıyor (20 saniye bekliyorum)...${NC}"
sleep 20

# Check service health
echo -e "\n${BLUE}================================${NC}"
echo -e "${BLUE}🏥 Servis Sağlık Kontrolü${NC}"
echo -e "${BLUE}================================${NC}\n"

# Function to check service health
check_health() {
    local url=$1
    local service_name=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ $service_name sağlıklı${NC}"
    else
        echo -e "${YELLOW}⚠️ $service_name şu an yanıt vermiyor (yanıt: $response)${NC}"
    fi
}

check_health "http://localhost:3001/packages/health/check" "Package Service"
check_health "http://localhost:3002/trackings/health/check" "Tracking Service"
check_health "http://localhost:3003/notifications/health/check" "Notification Service"

echo -e "\n${BLUE}================================${NC}"
echo -e "${BLUE}📍 Erişim Noktaları${NC}"
echo -e "${BLUE}================================${NC}\n"

echo -e "${GREEN}🌐 Dashboard:${NC} http://localhost:3000"
echo -e "${GREEN}📦 Package Service:${NC} http://localhost:3001"
echo -e "${GREEN}🚚 Tracking Service:${NC} http://localhost:3002"
echo -e "${GREEN}🔔 Notification Service:${NC} http://localhost:3003"
echo -e "${GREEN}🐰 RabbitMQ Admin:${NC} http://localhost:15672 (guest/guest)"
echo -e "${GREEN}🍃 MongoDB Package:${NC} localhost:27017"
echo -e "${GREEN}🍃 MongoDB Tracking:${NC} localhost:27018"
echo -e "${GREEN}🍃 MongoDB Notification:${NC} localhost:27019"

echo -e "\n${BLUE}================================${NC}"
echo -e "${BLUE}📋 Loglar${NC}"
echo -e "${BLUE}================================${NC}\n"

echo -e "Package Service Logs: ${YELLOW}tail -f /tmp/package-service.log${NC}"
echo -e "Tracking Service Logs: ${YELLOW}tail -f /tmp/tracking-service.log${NC}"
echo -e "Notification Service Logs: ${YELLOW}tail -f /tmp/notification-service.log${NC}"
echo -e "Dashboard Logs: ${YELLOW}tail -f /tmp/dashboard.log${NC}"

echo -e "\n${BLUE}================================${NC}"
echo -e "${GREEN}✅ Tüm servisler başarıyla başlatıldı!${NC}"
echo -e "${BLUE}================================${NC}\n"

echo -e "${YELLOW}💡 Dashboard'a gitmek için:${NC} http://localhost:3000"
echo -e "${YELLOW}💡 Servisleri durdurmak için:${NC} Ctrl+C (veya 'docker-compose down')"
echo -e "${YELLOW}💡 Tüm logları görmek için:${NC} docker-compose logs -f\n"

# Keep the script running and handle signals
cleanup() {
    echo -e "\n${YELLOW}🛑 Servisler kapatılıyor...${NC}"
    kill $PACKAGE_PID $TRACKING_PID $NOTIFICATION_PID $DASHBOARD_PID 2>/dev/null
    echo -e "${GREEN}✅ Servisler kapatıldı${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for all background processes
wait
