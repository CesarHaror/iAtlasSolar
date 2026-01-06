#!/bin/bash

# ════════════════════════════════════════════════════════════════
# INIT Y RUN - Compilar y arrancar servidor para testing
# ════════════════════════════════════════════════════════════════

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🚀 Iniciando iAtlas Solar - Backend + Testing         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Cambiar al directorio del backend
cd /Users/victorhugoharorodarte/Documents/AtlasSolar/backend

echo -e "${BLUE}1. Compilando TypeScript...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Compilación exitosa${NC}"
else
    echo -e "${YELLOW}❌ Error en compilación${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}2. Iniciando servidor...${NC}"
echo -e "${YELLOW}Servidor disponible en: http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}📚 ENDPOINTS DISPONIBLES:${NC}"
echo "  API:      /api"
echo "  Health:   /health"
echo ""
echo -e "${BLUE}🧪 TESTING ENDPOINTS:${NC}"
echo "  POST /api/testing/ocr/validate-single"
echo "  POST /api/testing/ocr/batch-validate"
echo "  POST /api/testing/dataset/generate"
echo "  GET  /api/testing/dataset/examples"
echo "  GET  /api/testing/dataset/template"
echo "  GET  /api/testing/ocr/metrics"
echo "  GET  /api/testing/ocr/report/html"
echo ""
echo -e "${BLUE}📍 Para ejecutar tests:${NC}"
echo "  En otra terminal:"
echo "  cd /Users/victorhugoharorodarte/Documents/AtlasSolar"
echo "  chmod +x test-recibo-real.sh"
echo "  ./test-recibo-real.sh"
echo ""

npm run dev
