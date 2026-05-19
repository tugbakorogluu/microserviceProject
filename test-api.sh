#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}🧪 API Test Script${NC}"
echo -e "${BLUE}=====================================${NC}\n"

BASE_URL="http://localhost"

# Test Package Service
echo -e "${YELLOW}1️⃣ Package Service Testleri${NC}\n"

echo -e "${BLUE}Health Check:${NC}"
curl -s http://localhost:3001/packages/health/check | jq .
echo -e "\n"

echo -e "${BLUE}Paket Oluştur:${NC}"
PACKAGE_RESPONSE=$(curl -s -X POST http://localhost:3001/packages \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "Ali Veli",
    "receiver": "Mehmet Turan"
  }')

echo "$PACKAGE_RESPONSE" | jq .

# Extract barcode for further tests
BARCODE=$(echo "$PACKAGE_RESPONSE" | jq -r '.data.barcode')
echo -e "\n"

echo -e "${BLUE}Paket Detaylarını Getir:${NC}"
curl -s http://localhost:3001/packages/$BARCODE | jq .
echo -e "\n"

echo -e "${BLUE}Tüm Paketleri Getir:${NC}"
curl -s http://localhost:3001/packages | jq .
echo -e "\n"

# Test Tracking Service
echo -e "${YELLOW}2️⃣ Tracking Service Testleri${NC}\n"

echo -e "${BLUE}Health Check:${NC}"
curl -s http://localhost:3002/trackings/health/check | jq .
echo -e "\n"

echo -e "${BLUE}Takip Bilgilerini Getir (${BARCODE}):${NC}"
curl -s http://localhost:3002/trackings/$BARCODE | jq .
echo -e "\n"

echo -e "${BLUE}Tüm Takip Bilgilerini Getir:${NC}"
curl -s http://localhost:3002/trackings | jq '.data | .[0:3]' # Show first 3
echo -e "\n"

# Test Notification Service
echo -e "${YELLOW}3️⃣ Notification Service Testleri${NC}\n"

echo -e "${BLUE}Health Check:${NC}"
curl -s http://localhost:3003/notifications/health/check | jq .
echo -e "\n"

echo -e "${BLUE}Bildirim İstatistikleri:${NC}"
curl -s http://localhost:3003/notifications/stats/all | jq .
echo -e "\n"

echo -e "${BLUE}Tüm Bildirimleri Getir:${NC}"
curl -s http://localhost:3003/notifications | jq '.data | .[0:3]' # Show first 3
echo -e "\n"

echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}✅ Testler tamamlandı!${NC}"
echo -e "${BLUE}=====================================${NC}\n"

echo -e "${YELLOW}💡 Dashboard'a erişim: http://localhost:3000${NC}\n"
