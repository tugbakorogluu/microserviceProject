#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}🧹 Sistem Temizleme Aracı${NC}"
echo -e "${BLUE}================================${NC}\n"

# Stop all services
echo -e "${YELLOW}🛑 Docker container'ları durduruluyor...${NC}"
docker-compose down

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker container'ları durduruldu${NC}\n"
else
    echo -e "${RED}❌ Docker container'larını durdurmada hata${NC}\n"
fi

# Remove node_modules and build directories
echo -e "${YELLOW}🗑️ Geçici dosyalar siliniyor...${NC}"

for service in package-service tracking-service notification-service dashboard; do
    if [ -d "$service" ]; then
        echo -e "  📦 $service: ${YELLOW}temizleniyor...${NC}"
        rm -rf "$service/node_modules"
        rm -rf "$service/.next"
        rm -rf "$service/dist"
        rm -f "$service/package-lock.json"
        echo -e "  ${GREEN}✅ $service temizlendi${NC}"
    fi
done

# Remove logs
echo -e "${YELLOW}📝 Log dosyaları siliniyor...${NC}"
rm -f /tmp/package-service.log
rm -f /tmp/tracking-service.log
rm -f /tmp/notification-service.log
rm -f /tmp/dashboard.log

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}✅ Sistem başarıyla temizlendi!${NC}"
echo -e "${BLUE}================================${NC}\n"

echo -e "${YELLOW}💡 Tekrar başlamak için: ./start.sh${NC}\n"
