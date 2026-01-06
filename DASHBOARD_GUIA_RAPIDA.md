# 🧪 GUÍA RÁPIDA - OCR TESTING DASHBOARD

## 🚀 Inicio Rápido

### 1. Acceder al Dashboard
```
URL: http://localhost:5173/testing/ocr
Menú: Sidebar izquierdo → "Pruebas OCR" 🔬
```

### 2. Login (si es necesario)
```
Tu usuario y contraseña del sistema
→ Redirect automático a /dashboard
→ Click en menú → Pruebas OCR
```

---

## 📊 Los 4 Tabs Explicados

### Tab 1: 📊 Overview (Inicio)
**Para ver:** Métricas generales y estado del OCR

```
TARJETAS (arriba):
├─ Total de Tests realizados
├─ Accuracy Promedio (en %)
├─ Tiempo Promedio (milisegundos)
└─ Rango Min/Max de Accuracy

GRÁFICO (centro):
└─ Accuracy por cada Campo OCR
   ├─ serviceNumber
   ├─ consumptionKWh
   └─ currentAmount
   
INDICADOR (abajo):
├─ ✅ GO: Accuracy ≥ 92%
├─ ⚠️  CONDITIONAL: 85-92%
└─ ❌ NO-GO: < 85%
```

**Acción:** Solo lectura (información)

---

### Tab 2: 📈 Resultados (Histórico)
**Para ver:** Lista de todos los tests realizados

```
TABLA con columnas:
├─ Test ID (identificador único)
├─ Archivo (nombre del PDF/imagen)
├─ Accuracy (% con color)
├─ Tiempo (ms de procesamiento)
└─ Fecha (cuándo se realizó)

COLORES de accuracy:
├─ Verde: ≥90% (excelente)
├─ Amarillo: 85-90% (aceptable)
└─ Rojo: <85% (revisar)
```

**Acción:** Ver histórico de tests

---

### Tab 3: ⬆️ Upload (Realizar Test)
**Para hacer:** Subir un nuevo recibo y validarlo

```
PASO 1: Seleccionar archivo Recibo
├─ Click en "Recibo (PDF o Imagen)"
├─ Seleccionar: PDF, JPG, PNG o GIF
└─ Feedback: ✓ nombre-archivo.pdf

PASO 2: Seleccionar archivo Ground Truth
├─ Click en "Ground Truth (JSON)"
├─ Seleccionar: archivo.json
└─ Feedback: ✓ ground-truth.json

PASO 3: Ejecutar Test
├─ Click botón "Ejecutar Test"
├─ Estado: "Procesando..."
├─ Esperar 1-2 segundos
└─ Popup: ✅ Test completado! Accuracy: 94.5%

PASO 4: Revisión
└─ Métricas y Resultados se actualizan automáticamente
```

**Ground Truth JSON ejemplo:**
```json
{
  "serviceNumber": "123456789012",
  "consumptionKWh": 245,
  "currentAmount": 1250.50,
  "billingPeriod": "2024-12",
  "customerName": "Juan Pérez"
}
```

---

### Tab 4: 📦 Batches (Lotes)
**Para ver:** Grupos de tests organizados

```
CARDS (grid 2 columnas):

┌─────────────────┐    ┌─────────────────┐
│ Nombre Batch    │    │ Nombre Batch    │
│ ID: abc123...   │    │ ID: def456...   │
│ Estado: ✅      │    │ Estado: ⏳      │
│ 8/10 tests      │    │ 5/10 tests      │
│ 92.3% Avg       │    │ 88.1% Avg       │
│ [Progreso]████  │    │ [Progreso]██    │
└─────────────────┘    └─────────────────┘
```

**Estado posibles:**
- ✅ COMPLETED (listo)
- ⏳ PROCESSING (en progreso)
- ⏸️ PENDING (pendiente)
- ❌ FAILED (error)

---

## 🎯 Casos de Uso Comunes

### Caso 1: Validar un Recibo Real
```
1. Click en tab "Upload"
2. Seleccionar recibo real de CFE (PDF)
3. Preparar ground truth JSON con valores correctos
4. Click "Ejecutar Test"
5. Ver resultado en popup
6. Check tab "Resultados" para histórico
```

### Caso 2: Ver Accuracy Promedio
```
1. Click en tab "Overview"
2. Ver tarjeta "Accuracy Promedio"
3. Si ≥92% → GO para FASE 1 ✅
4. Si 85-92% → CONDITIONAL (mejorar)
5. Si <85% → NO-GO (revisar OCR)
```

### Caso 3: Analizar Campos Débiles
```
1. Tab "Overview"
2. Mirar gráfico "Accuracy por Campo"
3. Ver cuál campo tiene accuracy más baja
4. Ejemplo: "consumptionKWh" baja → revisar OCR para números
```

### Caso 4: Comparar Tests Antiguos
```
1. Tab "Resultados"
2. Ver tabla con todos los tests
3. Comparar accuracy de diferentes fechas
4. Identificar tendencia (mejora/empeora)
```

---

## ✅ Checklist para Decisión GO/NO-GO

### Si ves "✅ GO" (≥92%):
```
✓ Accuracy está por encima de 92%
✓ Todos los campos funcionan bien
✓ Listo para FASE 1 (Multi-tenant)
✓ Proceder a implementar
```

### Si ves "⚠️ CONDITIONAL" (85-92%):
```
⚠ Accuracy está aceptable pero no excelente
⚠ Revisar campos con baja performance
⚠ Considerar:
   - Mejorar Tesseract config
   - Agregar más samples
   - Ajustar preprocessing de imágenes
```

### Si ves "❌ NO-GO" (<85%):
```
✗ Accuracy está por debajo de aceptable
✗ No proceder a FASE 1 aún
✗ Acciones requeridas:
  - Revisar OCR configuration
  - Validar que ground truth data sea correcto
  - Considerar modelo OCR alternativo
  - Aumentar resolución de imágenes
```

---

## 🔑 Funciones Especiales

### Indicador de Color en Accuracy
```
🟢 Verde (≥90%)
   └─ Excelente rendimiento

🟡 Amarillo (85-90%)
   └─ Aceptable, puede mejorar

🔴 Rojo (<85%)
   └─ Bajo, requiere atención
```

### Filtrado (opcional)
```
Tab "Resultados" permite:
- Ver últimos 10 tests
- Filtrar por batchId si existe
```

### Progreso de Batch
```
Barra visual muestra:
- Tests procesados vs total
- Ejemplo: "8/10" = 80% completo
```

---

## 🐛 Si Algo Falla

### Dashboard no carga
```
1. Verificar que backend esté corriendo
   → Terminal: npm run dev (en /backend)

2. Verificar login
   → Si no hay token, ir a /login

3. Abrir DevTools (F12)
   → Console tab
   → Ver si hay errores de red
```

### Error al subir archivo
```
1. Verificar tamaño archivo
   → Máximo recomendado: 5MB

2. Verificar formato
   → Recibo: PDF, JPG, PNG, GIF
   → Ground Truth: JSON

3. Verificar JSON válido
   → Usar: jsonlint.com si no está seguro
```

### Métricas no se actualizan
```
1. Click F5 para refrescar página
2. Esperar 2-3 segundos (fetch API)
3. Si persiste, revisar console (F12)
```

---

## 💡 Tips y Trucos

### Obtener Ground Truth Rápido
```
Si tienes un recibo PDF:
1. Abrirlo en Adobe Reader
2. Copiar manualmente valores
3. Pegar en JSON format

Si tienes múltiples:
1. Usar template predefinido
2. Solo cambiar valores numéricos
3. Usar script para automatizar
```

### Pruebas Masivas
```
Para test múltiples recibos:
1. Usar tab "Upload" repetidas veces
2. Cada test se guarda en BD
3. Métricas se promedian automáticamente
4. Ver resultados en "Resultados" tab
```

### Interpretar Resultados
```
- Si todos los tests tienen accuracy alto
  → OCR está funcionando bien

- Si hay variación grande (80-95%)
  → Revisar calidad de imágenes entrada

- Si un campo siempre falla
  → Optimizar Tesseract para ese tipo de dato
```

---

## 📞 Preguntas Frecuentes

### ¿Qué es Ground Truth?
```
Son los valores CORRECTOS del recibo
(lo que debe extraer el OCR correctamente)

Ejemplo:
- serviceNumber: "123456789012" (el número real)
- consumptionKWh: 245 (el consumo real)
```

### ¿Por qué el accuracy es bajo?
```
Causas posibles:
1. Imagen de recibo de mala calidad
2. Tesseract no entrenado para CFE
3. Ground truth data incorrecta
4. Campos no identificados correctamente
```

### ¿Cuántos tests necesito?
```
Mínimo recomendado: 30 recibos
Objetivo: 50+ diferentes tipos
- Domésticos (20)
- Comerciales (15)
- Industriales (15)
```

### ¿Qué significa "procesamiento"?
```
Tiempo en milisegundos que tarda OCR:
- Normal: 800-1500ms
- Lento: >2000ms (optimizar)
- Rápido: <500ms (muy bueno)
```

---

## 🎓 Flujo Recomendado para Validación

```
SEMANA 1:
├─ Recopilar 30+ recibos reales CFE
├─ Crear JSON ground truth para cada uno
└─ Hacer tests iniciales en "Upload" tab

SEMANA 2:
├─ Revisar Tab "Resultados"
├─ Analizar Tab "Overview" metrics
├─ Identificar campos con bajo accuracy
└─ Ajustar Tesseract si es necesario

SEMANA 3:
├─ Repet testing con config mejorada
├─ Monitorear progreso en gráficos
├─ Compilar Batches si es relevante
└─ Decidir GO/NO-GO

DECISIÓN FINAL:
├─ ✅ Si accuracy ≥92% → GO a FASE 1
├─ ⚠️ Si 85-92% → Mejorar + re-test
└─ ❌ Si <85% → Revisar OCR approach
```

---

## 📊 Exportar Datos (Futuro)

Próximas features:
```
- Descargar tabla de resultados en CSV
- Exportar gráficos como PNG
- Generar PDF con reporte completo
```

Por ahora, usar:
```
1. Screenshot de gráficos
2. Copiar tabla (Ctrl+A en tabla)
3. Pegar en Excel
```

---

## ✨ Recordatorio

**El Dashboard está diseñado para:**
✅ Ser fácil de usar (no requiere programación)  
✅ Validar OCR con datos reales  
✅ Tomar decisión GO/NO-GO automáticamente  
✅ Persistir datos en base de datos  
✅ Proporcionar visualización clara  

**No necesitas:**
❌ Terminal o comandos
❌ Conocimiento técnico
❌ Editar código
❌ Procesar datos manualmente

---

**¿Preguntas? Revisa OPCION_B_DASHBOARD.md para detalles técnicos.**

Adelante con el testing amigo! 🚀
