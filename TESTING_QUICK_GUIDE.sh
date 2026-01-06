#!/bin/bash

# SCRIPT DE TESTING RÁPIDO - FASE 4
# Guía paso a paso para ejecutar tests con recibos reales

echo "════════════════════════════════════════════════════════════════"
echo "  🧪 TESTING FRAMEWORK - GUÍA RÁPIDA"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Configurar variables
API_URL="${API_URL:-http://localhost:3000}"
TOKEN="${TOKEN:-tu_token_aqui}"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}PASO 1: Obtener ejemplos de recibos CFE${NC}"
echo "─────────────────────────────────────────────────────────"
echo ""
echo "curl -X GET $API_URL/api/testing/dataset/examples \\"
echo "  -H 'Authorization: Bearer $TOKEN'"
echo ""
echo "Respuesta esperada:"
echo '  {
    "domestico_basico": { ... },
    "domestico_alto_consumo": { ... },
    "comercial": { ... },
    "industrial": { ... }
  }'
echo ""

echo -e "${BLUE}PASO 2: Obtener plantilla para ground truth${NC}"
echo "─────────────────────────────────────────────────────────"
echo ""
echo "curl -X GET $API_URL/api/testing/dataset/template \\"
echo "  -H 'Authorization: Bearer $TOKEN'"
echo ""
echo "Esto te mostrará:"
echo "  - Estructura requerida"
echo "  - Descripción de cada campo"
echo "  - Formato esperado"
echo ""

echo -e "${BLUE}PASO 3: Generar dataset de testing (opcional)${NC}"
echo "─────────────────────────────────────────────────────────"
echo ""
echo "curl -X POST $API_URL/api/testing/dataset/generate \\"
echo "  -H 'Authorization: Bearer $TOKEN' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"count\": 10, \"includeVariations\": true}'"
echo ""
echo "Esto genera 10 recibos de ejemplo listos para usar"
echo ""

echo -e "${BLUE}PASO 4: Validar UN solo recibo real${NC}"
echo "─────────────────────────────────────────────────────────"
echo ""
echo "curl -X POST $API_URL/api/testing/ocr/validate-single \\"
echo "  -H 'Authorization: Bearer $TOKEN' \\"
echo "  -F 'file=@tu_recibo.pdf' \\"
echo "  -F 'groundTruth=@ground_truth.json'"
echo ""
echo "Archivos necesarios:"
echo "  - tu_recibo.pdf: El recibo real (PDF o imagen)"
echo "  - ground_truth.json: Valores correctos extraídos manualmente"
echo ""

echo -e "${BLUE}PASO 5: Ver métricas de precisión${NC}"
echo "─────────────────────────────────────────────────────────"
echo ""
echo "curl -X GET $API_URL/api/testing/ocr/metrics \\"
echo "  -H 'Authorization: Bearer $TOKEN'"
echo ""
echo "Respuesta:"
echo '  {
    "totalTests": 1,
    "avgAccuracy": 92.5,
    "fieldMetrics": {
      "serviceNumber": { "accuracy": 100 },
      "consumptionKWh": { "accuracy": 89 },
      ...
    }
  }'
echo ""

echo -e "${BLUE}PASO 6: Descargar reporte HTML${NC}"
echo "─────────────────────────────────────────────────────────"
echo ""
echo "curl -X GET $API_URL/api/testing/ocr/report/html \\"
echo "  -H 'Authorization: Bearer $TOKEN' \\"
echo "  -o reporte_ocr.html"
echo ""
echo "open reporte_ocr.html  # Abrir en navegador"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ PRÓXIMOS PASOS:${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "1️⃣  Obtén un TOKEN válido:"
echo "    - Haz login en /api/auth/login"
echo "    - Copia el token de respuesta"
echo ""
echo "2️⃣  Prepara un recibo real:"
echo "    - Descarga un recibo CFE real (PDF o foto)"
echo "    - Extrae manualmente los valores"
echo "    - Crea un JSON con estructura de ground truth"
echo ""
echo "3️⃣  Ejecuta la validación:"
echo "    ./run-test.sh  # Script personalizado"
echo ""
echo "4️⃣  Analiza los resultados:"
echo "    - Revisa métricas de precisión"
echo "    - Identifica campos problemáticos"
echo "    - Decide: ¿Proceder con FASE 1?"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo -e "${YELLOW}📝 EJEMPLO DE GROUND TRUTH (ground_truth.json):${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
cat << 'EOF'
{
  "serviceNumber": "123456789012",
  "clientName": "Juan Pérez García",
  "address": "Calle Principal 123, Apartamento 4B",
  "billingPeriod": "Enero 2024",
  "issueDate": "2024-01-25",
  "dueDate": "2024-02-10",
  "consumptionKWh": 245,
  "rate": "Doméstico",
  "consumption": "Normal",
  "currentAmount": 1250.50,
  "previousReading": 12345,
  "currentReading": 12590,
  "billingDays": 30
}
EOF
echo ""

echo "════════════════════════════════════════════════════════════════"
echo -e "${YELLOW}📞 PREGUNTAS FRECUENTES:${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "P: ¿Dónde obtengo el TOKEN?"
echo "R: Ejecuta: curl -X POST http://localhost:3000/api/auth/login"
echo ""
echo "P: ¿Qué formato debe tener el recibo?"
echo "R: PDF, JPG, PNG o GIF. Máximo 50MB"
echo ""
echo "P: ¿Qué es 'ground truth'?"
echo "R: Los valores correctos del recibo (extraídos manualmente)"
echo ""
echo "P: ¿Cuántos tests necesito?"
echo "R: Mínimo 20, objetivo 50 para validación estadística"
echo ""

echo "════════════════════════════════════════════════════════════════"
