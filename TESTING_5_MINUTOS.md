# ⚡ TESTEAR EN 5 MINUTOS - GUÍA ULTRA-RÁPIDA

**Sí, ya puedes testear con un recibo real AHORA.**

---

## 🔥 OPCIÓN MÁS RÁPIDA (Script Automático)

```bash
# 1. Hacer ejecutable el script
chmod +x /Users/victorhugoharorodarte/Documents/AtlasSolar/test-recibo-real.sh

# 2. Ejecutar
./test-recibo-real.sh

# 3. Seguir pasos interactivos
# - Ingresar credenciales
# - Ingresar valores del recibo
# - Seleccionar archivo PDF
# - Ver resultados
```

**Tiempo:** 5 minutos ⏱️

---

## 🎯 PASOS MANUALES (Si prefieres curl)

### Paso 1: Obtener Token (1 minuto)
```bash
export API_URL="http://localhost:3000"
export EMAIL="tu@email.com"
export PASSWORD="tu_contraseña"

# Login
TOKEN=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" \
  | jq -r '.data.token')

echo "Token: $TOKEN"
```

### Paso 2: Ver Plantilla (30 segundos)
```bash
curl -s $API_URL/api/testing/dataset/template \
  -H "Authorization: Bearer $TOKEN" | jq '.data.template'
```

### Paso 3: Crear Ground Truth (2 minutos)
Crea archivo `ground_truth.json`:
```json
{
  "serviceNumber": "123456789012",
  "clientName": "Tu Nombre",
  "billingPeriod": "Enero 2024",
  "issueDate": "2024-01-25",
  "dueDate": "2024-02-10",
  "consumptionKWh": 245,
  "currentAmount": 1250.50,
  "previousReading": 12345,
  "currentReading": 12590,
  "billingDays": 30
}
```

### Paso 4: Validar Recibo (1 minuto)
```bash
curl -X POST $API_URL/api/testing/ocr/validate-single \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@tu_recibo.pdf" \
  -F "groundTruth=@ground_truth.json" | jq '.'
```

### Paso 5: Ver Resultado
```json
{
  "status": "success",
  "data": {
    "testId": "test-1704067200000",
    "validation": {
      "overallAccuracy": 92.5,
      "fieldResults": {
        "serviceNumber": { "accuracy": 100, "status": "match" },
        "consumptionKWh": { "accuracy": 100, "status": "match" },
        "currentAmount": { "accuracy": 85, "status": "incorrect" }
      }
    }
  }
}
```

---

## 📊 SIN DATOS REALES (Testing de Ejemplo)

Si aún no tienes un recibo real:

```bash
# Generar 10 recibos de ejemplo
curl -X POST $API_URL/api/testing/dataset/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"count": 10}' | jq '.'

# Esto te da datos listos para testear
```

---

## 📈 VER MÉTRICAS

```bash
curl $API_URL/api/testing/ocr/metrics \
  -H "Authorization: Bearer $TOKEN" | jq '.data | {
    totalTests,
    avgAccuracy,
    fieldMetrics: .fieldMetrics | 
      to_entries | 
      map({(.key): .value.accuracy}) | 
      add
  }'
```

**Respuesta esperada:**
```json
{
  "totalTests": 1,
  "avgAccuracy": 92.5,
  "fieldMetrics": {
    "serviceNumber": 100,
    "consumptionKWh": 100,
    "currentAmount": 85
  }
}
```

---

## 🎨 DESCARGAR REPORTE HTML

```bash
curl $API_URL/api/testing/ocr/report/html \
  -H "Authorization: Bearer $TOKEN" > reporte.html

# Abrir en navegador
open reporte.html
```

---

## ✅ DECISIÓN FINAL

**Después de 1-2 semanas de testing:**

| Accuracy | Decisión | Acción |
|----------|----------|--------|
| ≥ 92% | ✅ GO | Proceder FASE 1 |
| 85-92% | ⚠️ CONDITIONAL | Mejorar OCR + retest |
| < 85% | ❌ NO-GO | Pausar y revisar |

---

## 📋 REQUIREMENTS MÍNIMOS

- [ ] Python 3.8+ (para tesseract en OCR avanzado)
- [ ] 50MB espacio libre
- [ ] Un recibo PDF real (o usar ejemplo)
- [ ] Token de autenticación válido

---

## 🚨 TROUBLESHOOTING RÁPIDO

| Problema | Solución |
|----------|----------|
| Error 401 | Token inválido → haz login de nuevo |
| File not found | Verifica ruta del PDF |
| Bad JSON | Usa template para ver estructura correcta |
| Slow processing | Reduce tamaño de imagen |

---

## 🎓 EJEMPLO COMPLETO (Copiar-Pegar)

```bash
#!/bin/bash
set -e

API_URL="http://localhost:3000"

# 1. Login
TOKEN=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@ejemplo.com","password":"password"}' \
  | jq -r '.data.token')

# 2. Crear ground truth
cat > ground_truth.json << 'EOF'
{"serviceNumber":"123456789012","consumptionKWh":245,"currentAmount":1250.50}
EOF

# 3. Validar
curl -X POST $API_URL/api/testing/ocr/validate-single \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@tu_recibo.pdf" \
  -F "groundTruth=@ground_truth.json" | jq '.'

# 4. Ver métricas
curl $API_URL/api/testing/ocr/metrics \
  -H "Authorization: Bearer $TOKEN" | jq '.data.avgAccuracy'
```

---

## 🎯 TU PRÓXIMO PASO

**AHORA:**
1. Obtén un recibo CFE real o crea ground_truth.json
2. Ejecuta el script: `./test-recibo-real.sh`
3. Ve los resultados en HTML

**LUEGO:**
1. Recopila 20-50 recibos más
2. Ejecuta batch validation
3. Analiza si accuracy >= 92%
4. Decide: ¿FASE 1?

---

**¡Listo para empezar!** 🚀

