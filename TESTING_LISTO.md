# ✅ LISTO PARA TESTING - GUÍA PASO A PASO

**Status:** ✅ Sistema completamente funcional  
**Compilación:** ✅ 0 errores TypeScript  
**Archivos nuevos:** testing-dataset.routes.ts (250 líneas)

---

## 🚀 SÍ, YA PUEDES TESTEAR CON UN RECIBO REAL

### Requisitos Previos

1. **Servidor corriendo**
   ```bash
   cd /Users/victorhugoharorodarte/Documents/AtlasSolar/backend
   npm run dev
   ```

2. **Token de autenticación**
   - Haz login primero para obtener token
   - O usa un token existente

3. **Un recibo real** (PDF o imagen JPG/PNG)

---

## 📋 FLUJO DE TESTING EN 5 MINUTOS

### PASO 1: Obtener Plantilla de Ground Truth
```bash
curl http://localhost:3000/api/testing/dataset/template \
  -H "Authorization: Bearer TU_TOKEN"
```

**Respuesta:** Te mostrará la estructura exacta que necesitas

### PASO 2: Crear Ground Truth JSON

Crea un archivo `ground_truth.json` con los valores correctos de tu recibo:

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

**Nota:** Estos son los valores que extraes **manualmente** de tu recibo real

### PASO 3: Validar el Recibo

```bash
curl -X POST http://localhost:3000/api/testing/ocr/validate-single \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "file=@tu_recibo.pdf" \
  -F "groundTruth=@ground_truth.json"
```

**Respuesta esperada:**
```json
{
  "status": "success",
  "data": {
    "testId": "test-1704067200000",
    "validation": {
      "overallAccuracy": 92.5,
      "fieldResults": {
        "serviceNumber": {
          "accuracy": 100,
          "status": "match"
        },
        "consumptionKWh": {
          "accuracy": 100,
          "status": "match"
        }
      }
    }
  }
}
```

### PASO 4: Ver Métricas
```bash
curl http://localhost:3000/api/testing/ocr/metrics \
  -H "Authorization: Bearer TU_TOKEN"
```

### PASO 5: Descargar Reporte HTML
```bash
curl http://localhost:3000/api/testing/ocr/report/html \
  -H "Authorization: Bearer TU_TOKEN" > reporte.html

# Abrir en navegador
open reporte.html
```

---

## 🎯 OPCIONES RÁPIDAS

### Opción A: Usar Script Interactivo (MÁS FÁCIL)

```bash
cd /Users/victorhugoharorodarte/Documents/AtlasSolar
export TEST_TOKEN="tu_token"
ts-node testing-cli.ts
```

Menú interactivo con todas las opciones.

### Opción B: Usar Script Bash

```bash
chmod +x TESTING_QUICK_GUIDE.sh
./TESTING_QUICK_GUIDE.sh
```

Muestra todos los comandos disponibles.

### Opción C: Generar Dataset de Ejemplo (SIN datos reales)

```bash
curl -X POST http://localhost:3000/api/testing/dataset/generate \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"count": 10, "includeVariations": true}' | jq
```

Esto genera 10 recibos de ejemplo listos para testear.

---

## 📊 NUEVOS ENDPOINTS DISPONIBLES

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/testing/dataset/generate` | POST | Generar dataset de testing |
| `/api/testing/dataset/examples` | GET | Ver ejemplos predefinidos |
| `/api/testing/dataset/template` | GET | Ver plantilla de ground truth |
| `/api/testing/dataset/sample-single` | POST | Generar UN recibo de ejemplo |
| `/api/testing/dataset/export/json` | GET | Exportar dataset en JSON |
| `/api/testing/dataset/export/csv` | GET | Exportar dataset en CSV |
| `/api/testing/dataset/validate-structure` | POST | Validar estructura de datos |

---

## 🔐 Obtener Token de Autenticación

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu_email@ejemplo.com",
    "password": "tu_contraseña"
  }'

# 2. Guardar el token de la respuesta
export TEST_TOKEN="eyJhbGciOiJIUzI1NiIs..."

# 3. Usar en requests
curl http://localhost:3000/api/testing/dataset/template \
  -H "Authorization: Bearer $TEST_TOKEN"
```

---

## 📝 EJEMPLO COMPLETO (Copiar y Pegar)

### 1. Crear ground_truth.json
```bash
cat > ground_truth.json << 'EOF'
{
  "serviceNumber": "987654321098",
  "clientName": "María López Rodríguez",
  "billingPeriod": "Enero 2024",
  "issueDate": "2024-01-25",
  "dueDate": "2024-02-10",
  "consumptionKWh": 850,
  "currentAmount": 5320.75,
  "previousReading": 11000,
  "currentReading": 11850,
  "billingDays": 30
}
EOF
```

### 2. Testear (reemplaza TU_TOKEN y tu_recibo.pdf)
```bash
curl -X POST http://localhost:3000/api/testing/ocr/validate-single \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "file=@tu_recibo.pdf" \
  -F "groundTruth=@ground_truth.json" | jq '.' 
```

### 3. Ver resultados
```bash
curl http://localhost:3000/api/testing/ocr/metrics \
  -H "Authorization: Bearer TU_TOKEN" | jq '.data | {totalTests, avgAccuracy, fieldMetrics}'
```

---

## ✅ CHECKLIST PARA EMPEZAR HOY

- [ ] Servidor corriendo en puerto 3000
- [ ] Token de autenticación obtenido
- [ ] Recibo real descargado (PDF o JPG)
- [ ] Valores correctos extraídos del recibo
- [ ] Archivo ground_truth.json creado
- [ ] Primer test ejecutado
- [ ] Métricas revisadas
- [ ] Reporte HTML descargado

---

## 🎓 CASOS DE USO

### Caso 1: Un Solo Recibo
```bash
# Crear ground_truth.json manualmente
# Ejecutar validate-single
# Ver accuracy
```

### Caso 2: Múltiples Recibos (20-50)
```bash
# 1. Crear dataset con múltiples ground truths
# 2. Ejecutar batch-validate
# 3. Analizar métricas agregadas
# 4. Descargar reporte HTML
```

### Caso 3: Testing Sin Datos Reales
```bash
# 1. Generar dataset automático
# 2. Usar como validación de pipeline
# 3. Verificar que sistema funciona end-to-end
```

---

## 🚨 TROUBLESHOOTING

**Error: 401 Unauthorized**
- El token no es válido o expiró
- Haz login de nuevo para obtener nuevo token

**Error: File not found**
- Verifica la ruta del recibo PDF
- Asegúrate que el archivo existe

**Error: Invalid ground truth structure**
- Revisa que JSON tiene la estructura correcta
- Usa el endpoint `/dataset/template` para ver estructura

**Accuracy muy bajo (<80%)**
- OCR necesita mejora
- Revisa calidad de imagen del recibo
- Identifica campos problemáticos en reporte

---

## 📚 DOCUMENTACIÓN COMPLETA

Para detalles completos, ver:
- [TESTING_FRAMEWORK.md](./TESTING_FRAMEWORK.md) - 600+ líneas
- [QUICK_START_TESTING.md](./QUICK_START_TESTING.md) - Guía rápida

---

## 🎯 PRÓXIMO PASO

Una vez tengas tu primer test corriendo exitosamente:

1. **Recopila 20-50 recibos reales**
2. **Ejecuta testing masivo**
3. **Analiza métricas**
4. **Toma decisión sobre FASE 1**

---

**¡Estás listo para empezar!** 🚀

Si tienes un recibo real a mano, puedes testear en 5 minutos.

