# GUÍA RÁPIDA - Testing Framework FASE 4

**Status:** ✅ Implementado y Compilado  
**Archivos Creados:** 3 archivos (1,200+ líneas de código)

---

## 🚀 Resumen Rápido

Se ha implementado un **Framework de Testing Completo** para validar precisión de OCR con datos reales:

### Archivos Creados

1. **`ocr-validation.service.ts`** (350 líneas)
   - Servicio de validación que compara OCR vs ground truth
   - Cálculo de precisión por campo y general
   - Generación de reportes HTML/JSON

2. **`testing.routes.ts`** (450 líneas)
   - 8 endpoints REST para testing
   - Validación individual o masiva
   - Descarga de reportes y métricas

3. **`testing-data.generator.ts`** (400 líneas)
   - Generador de datasets de prueba
   - Ejemplos predefinidos de recibos CFE
   - Utilidades para validar estructura de datos

### Endpoints Disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/testing/ocr/validate-single` | Validar 1 recibo contra ground truth |
| POST | `/api/testing/ocr/batch-validate` | Validar múltiples recibos (masivo) |
| GET | `/api/testing/ocr/results` | Obtener histórico de tests |
| GET | `/api/testing/ocr/metrics` | Ver métricas agregadas |
| GET | `/api/testing/ocr/report/html` | Descargar reporte HTML |
| GET | `/api/testing/ocr/report/json` | Descargar reporte JSON |
| DELETE | `/api/testing/ocr/results` | Limpiar todos los tests |
| GET | `/api/testing/health` | Estado del sistema de testing |

---

## 📋 Cómo Usar (Paso a Paso)

### 1️⃣ Preparar Datos de Testing

Recopila 20-50 recibos CFE reales y crea un JSON:

```json
[
  {
    "base64": "JVBERi0xLjQK...",
    "fileName": "cfe_2024_01_001.pdf",
    "groundTruth": {
      "serviceNumber": "123456789012",
      "clientName": "Juan Pérez García",
      "billingPeriod": "Enero 2024",
      "issueDate": "2024-01-25",
      "consumptionKWh": 245,
      "currentAmount": 1250.50,
      "previousReading": 12345,
      "currentReading": 12590
    }
  }
]
```

**Guardar como:** `testing-dataset.json`

### 2️⃣ Ejecutar Testing Masivo

```bash
curl -X POST http://localhost:3000/api/testing/ocr/batch-validate \
  -H "Authorization: Bearer <tu_token>" \
  -F "testDataset=@testing-dataset.json"
```

**Respuesta esperada:**
```json
{
  "status": "success",
  "data": {
    "totalTests": 20,
    "processedCount": 20,
    "errorCount": 0,
    "avgAccuracy": 91.8,
    "avgProcessingTime": 3150,
    "results": [...]
  }
}
```

### 3️⃣ Ver Métricas

```bash
curl http://localhost:3000/api/testing/ocr/metrics \
  -H "Authorization: Bearer <tu_token>" | jq
```

**Respuesta esperada:**
```json
{
  "totalTests": 20,
  "avgAccuracy": 91.8,
  "fieldMetrics": {
    "serviceNumber": {
      "accuracy": 98.5,
      "errorCount": 1
    },
    "consumptionKWh": {
      "accuracy": 89.2,
      "errorCount": 2
    },
    "currentAmount": {
      "accuracy": 87.5,
      "errorCount": 2
    }
  },
  "recommendations": [...]
}
```

### 4️⃣ Descargar Reporte HTML

```bash
curl http://localhost:3000/api/testing/ocr/report/html \
  -H "Authorization: Bearer <tu_token>" > ocr-validation-report.html

# Abrir en navegador
open ocr-validation-report.html
```

---

## 📊 Criterios de Éxito

### Go/No-Go para FASE 1

```
IF overall_accuracy >= 92%:
  ✅ PROCEDER CON FASE 1 (Multi-tenant)
  
IF overall_accuracy 85-92%:
  ⚠️ PROCEDER CON MEJORAS (Ajustar OCR + retest)
  
IF overall_accuracy < 85%:
  ❌ PAUSAR Y REVISAR (Problemas en OCR)
```

### Benchmarks por Campo

| Campo | Mínimo | Objetivo | Crítico |
|-------|--------|----------|---------|
| serviceNumber | 95% | 99%+ | <90% ❌ |
| consumptionKWh | 88% | 95%+ | <85% ❌ |
| currentAmount | 90% | 96%+ | <88% ❌ |
| **Overall** | **85%** | **92%+** | **<80% ❌** |

---

## 🛠️ Pasos para la Semana 1-2

### Semana 1: Recopilación de Datos
- [ ] Recopilar 20-50 recibos CFE reales
- [ ] Extraer manualmente valores correctos (ground truth)
- [ ] Crear archivo JSON estructurado

### Semana 2: Testing & Análisis
- [ ] Ejecutar batch validation
- [ ] Revisar métricas por campo
- [ ] Descargar reporte HTML
- [ ] Analizar errores comunes
- [ ] Decidir: ¿Proceder con FASE 1 o ajustar OCR?

---

## 🔧 Ejemplos de Uso

### Validar Un Solo Recibo
```bash
curl -X POST http://localhost:3000/api/testing/ocr/validate-single \
  -H "Authorization: Bearer <token>" \
  -F "file=@recibo_cliente.pdf" \
  -F "groundTruth=@truth.json"
```

### Generar Dataset de Ejemplo (TypeScript)
```typescript
import testingDataGenerator from './testing-data.generator';

// Crear 20 muestras de prueba
const dataset = testingDataGenerator.generateTestDataset(20, {
  includeVariations: true
});

// Guardar a JSON
const json = JSON.stringify(dataset, null, 2);
fs.writeFileSync('testing-dataset.json', json);

// Exportar a CSV para análisis
const csv = testingDataGenerator.generateTestingCSV(20);
fs.writeFileSync('testing-dataset.csv', csv);
```

---

## 📚 Documentación Completa

Para documentación detallada, ver:
👉 [TESTING_FRAMEWORK.md](./TESTING_FRAMEWORK.md) (600+ líneas)

---

## ✅ Status de Implementación

| Componente | Status | Líneas | Notas |
|-----------|--------|--------|-------|
| OCRValidationService | ✅ | 350 | Listo para usar |
| Testing Routes (API) | ✅ | 450 | Endpoints listos |
| Data Generator | ✅ | 400 | Ejemplos incluidos |
| **Total** | ✅ | **1,200+** | **Compilado sin errores** |

---

## 🎯 Próximos Pasos

1. **Preparar datos** (Tú) - Recopila 20-50 recibos reales
2. **Ejecutar tests** (Tu servidor) - Usa los endpoints de testing
3. **Revisar métricas** (Tu análisis) - Evalúa resultados
4. **Tomar decisión** (Tú) - ¿Proceder con FASE 1?

---

## 📞 Preguntas Frecuentes

**P: ¿Cuántos tests necesito?**  
R: Mínimo 20, objetivo 50. Más datos = mejor validación estadística.

**P: ¿Qué es "ground truth"?**  
R: Los valores correctos del recibo (extraídos manualmente o de sistema CFE).

**P: ¿Cuál es el tiempo de procesamiento esperado?**  
R: 2-4 segundos por recibo (depende del formato y calidad de imagen).

**P: ¿Si la accuracy es <92%, qué debo hacer?**  
R: Identificar campos problemáticos y ajustar OCR o preprocesamiento de imagen.

---

**Creado:** Enero 2024  
**Versión:** 1.0.0  
**Status:** ✅ Listo para Producción

