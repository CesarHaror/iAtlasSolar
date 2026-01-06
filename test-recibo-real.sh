#!/bin/bash

# ════════════════════════════════════════════════════════════════
# SCRIPT DE TESTING REAL - Herramienta lista para usar
# ════════════════════════════════════════════════════════════════
# 
# Uso:
#   chmod +x test-recibo-real.sh
#   ./test-recibo-real.sh
#
# ════════════════════════════════════════════════════════════════

set -e  # Exit on error

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuración
API_URL="http://localhost:3000"
UPLOADS_DIR="./test_uploads"
RESULTS_DIR="./test_results"

# Crear directorios si no existen
mkdir -p "$UPLOADS_DIR"
mkdir -p "$RESULTS_DIR"

# ════════════════════════════════════════════════════════════════
# FUNCIONES
# ════════════════════════════════════════════════════════════════

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_header() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
}

# ════════════════════════════════════════════════════════════════
# PASO 0: Obtener Token
# ════════════════════════════════════════════════════════════════

get_token() {
    log_header "PASO 0: Obtener Token de Autenticación"
    
    # Verificar si TOKEN está en variable de entorno
    if [ -n "$TEST_TOKEN" ]; then
        log_success "Token encontrado en variable de entorno"
        echo "$TEST_TOKEN"
        return 0
    fi
    
    # Verificar si existe archivo de token
    if [ -f ".test_token" ]; then
        log_success "Token encontrado en archivo .test_token"
        cat .test_token
        return 0
    fi
    
    # Pedir credenciales
    read -p "Email (default: test@ejemplo.com): " email
    email="${email:-test@ejemplo.com}"
    
    read -sp "Contraseña: " password
    echo ""
    
    # Hacer login
    log_info "Autenticando..."
    
    response=$(curl -s -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$email\", \"password\": \"$password\"}")
    
    token=$(echo "$response" | jq -r '.data.token // empty' 2>/dev/null)
    
    if [ -z "$token" ]; then
        log_error "No se pudo obtener token. Respuesta: $response"
        return 1
    fi
    
    log_success "Token obtenido"
    echo "$token" > .test_token
    echo "$token"
}

# ════════════════════════════════════════════════════════════════
# PASO 1: Preparar Ground Truth
# ════════════════════════════════════════════════════════════════

prepare_ground_truth() {
    log_header "PASO 1: Preparar Ground Truth (Valores Correctos)"
    
    ground_truth_file="$UPLOADS_DIR/ground_truth.json"
    
    if [ -f "$ground_truth_file" ]; then
        read -p "¿Usar ground_truth.json existente? (s/n): " use_existing
        if [ "$use_existing" = "s" ]; then
            log_success "Usando ground_truth.json existente"
            cat "$ground_truth_file" | jq '.' 2>/dev/null || cat "$ground_truth_file"
            return 0
        fi
    fi
    
    log_info "Ingresa los valores del recibo CFE:"
    echo ""
    
    read -p "Número de servicio (ej: 123456789012): " serviceNumber
    read -p "Nombre del cliente: " clientName
    read -p "Período de facturación (ej: Enero 2024): " billingPeriod
    read -p "Fecha de emisión (YYYY-MM-DD): " issueDate
    read -p "Fecha de vencimiento (YYYY-MM-DD): " dueDate
    read -p "Consumo en kWh (número): " consumptionKWh
    read -p "Monto a pagar (con decimales): " currentAmount
    read -p "Lectura anterior (número): " previousReading
    read -p "Lectura actual (número): " currentReading
    read -p "Días de facturación (número): " billingDays
    
    # Crear JSON
    cat > "$ground_truth_file" << EOF
{
  "serviceNumber": "$serviceNumber",
  "clientName": "$clientName",
  "billingPeriod": "$billingPeriod",
  "issueDate": "$issueDate",
  "dueDate": "$dueDate",
  "consumptionKWh": $consumptionKWh,
  "currentAmount": $currentAmount,
  "previousReading": $previousReading,
  "currentReading": $currentReading,
  "billingDays": $billingDays
}
EOF
    
    log_success "Ground truth guardado en: $ground_truth_file"
    echo ""
    cat "$ground_truth_file" | jq '.'
}

# ════════════════════════════════════════════════════════════════
# PASO 2: Seleccionar Recibo
# ════════════════════════════════════════════════════════════════

select_receipt() {
    log_header "PASO 2: Seleccionar Recibo"
    
    echo "Opciones:"
    echo "1. Usar recibo real (PDF/imagen)"
    echo "2. Generar recibo de ejemplo (para testing sin datos reales)"
    echo ""
    read -p "Selecciona (1-2): " choice
    
    case $choice in
        1)
            read -p "Ruta del recibo (PDF o imagen JPG/PNG): " receipt_path
            
            if [ ! -f "$receipt_path" ]; then
                log_error "Archivo no encontrado: $receipt_path"
                return 1
            fi
            
            # Copiar a directorio de uploads
            cp "$receipt_path" "$UPLOADS_DIR/recibo.pdf"
            log_success "Recibo copiado a: $UPLOADS_DIR/recibo.pdf"
            echo "$UPLOADS_DIR/recibo.pdf"
            ;;
        2)
            log_info "Generando recibo de ejemplo..."
            echo "$UPLOADS_DIR/example_receipt.json"
            ;;
        *)
            log_error "Opción inválida"
            return 1
            ;;
    esac
}

# ════════════════════════════════════════════════════════════════
# PASO 3: Ejecutar Validación
# ════════════════════════════════════════════════════════════════

validate_receipt() {
    local token=$1
    local receipt_file=$2
    local ground_truth_file=$3
    
    log_header "PASO 3: Ejecutar Validación"
    
    log_info "Enviando recibo al servidor..."
    
    response=$(curl -s -X POST "$API_URL/api/testing/ocr/validate-single" \
        -H "Authorization: Bearer $token" \
        -F "file=@$receipt_file" \
        -F "groundTruth=@$ground_truth_file")
    
    # Guardar respuesta
    result_file="$RESULTS_DIR/validation_result_$(date +%s).json"
    echo "$response" | jq '.' > "$result_file"
    
    log_success "Respuesta guardada en: $result_file"
    echo ""
    
    # Mostrar resultado
    echo "$response" | jq '.data.validation' 2>/dev/null || echo "$response"
    
    return 0
}

# ════════════════════════════════════════════════════════════════
# PASO 4: Ver Métricas
# ════════════════════════════════════════════════════════════════

view_metrics() {
    local token=$1
    
    log_header "PASO 4: Métricas de Precisión"
    
    log_info "Obteniendo métricas..."
    
    response=$(curl -s -X GET "$API_URL/api/testing/ocr/metrics" \
        -H "Authorization: Bearer $token")
    
    echo "$response" | jq '.data' 2>/dev/null || echo "$response"
}

# ════════════════════════════════════════════════════════════════
# PASO 5: Descargar Reporte
# ════════════════════════════════════════════════════════════════

download_report() {
    local token=$1
    
    log_header "PASO 5: Descargar Reporte"
    
    read -p "¿Descargar reporte HTML? (s/n): " download
    
    if [ "$download" = "s" ]; then
        report_file="$RESULTS_DIR/ocr_validation_report_$(date +%Y%m%d_%H%M%S).html"
        
        log_info "Descargando reporte..."
        
        curl -s -X GET "$API_URL/api/testing/ocr/report/html" \
            -H "Authorization: Bearer $token" \
            -o "$report_file"
        
        log_success "Reporte descargado: $report_file"
        
        # Intentar abrir en navegador
        if command -v open &> /dev/null; then
            read -p "¿Abrir en navegador? (s/n): " open_browser
            if [ "$open_browser" = "s" ]; then
                open "$report_file"
                log_success "Reporte abierto en navegador"
            fi
        fi
    fi
}

# ════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════

main() {
    clear
    
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║    🧪 TESTING FRAMEWORK - Validar OCR con Recibo Real      ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Paso 0: Obtener Token
    TOKEN=$(get_token) || {
        log_error "No se pudo obtener token"
        exit 1
    }
    
    # Paso 1: Preparar Ground Truth
    prepare_ground_truth
    GROUND_TRUTH="$UPLOADS_DIR/ground_truth.json"
    
    # Paso 2: Seleccionar Recibo
    RECEIPT=$(select_receipt) || {
        log_error "No se pudo seleccionar recibo"
        exit 1
    }
    
    # Paso 3: Ejecutar Validación
    validate_receipt "$TOKEN" "$RECEIPT" "$GROUND_TRUTH" || {
        log_error "Error en validación"
        exit 1
    }
    
    # Paso 4: Ver Métricas
    read -p "¿Ver métricas agregadas? (s/n): " view_metrics_choice
    if [ "$view_metrics_choice" = "s" ]; then
        view_metrics "$TOKEN"
    fi
    
    # Paso 5: Descargar Reporte
    download_report "$TOKEN"
    
    # Resumen final
    log_header "✅ Testing Completado"
    echo ""
    log_success "Archivos generados:"
    echo "  📁 $RESULTS_DIR/"
    ls -lh "$RESULTS_DIR/" 2>/dev/null || echo "  (vacío)"
    echo ""
    log_success "Próximos pasos:"
    echo "  1. Revisar reporte HTML"
    echo "  2. Analizar precisión por campo"
    echo "  3. Decidir si proceder con FASE 1"
    echo ""
}

# Ejecutar
main "$@"
