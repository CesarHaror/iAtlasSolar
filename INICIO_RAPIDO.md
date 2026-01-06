# 🚀 INICIO RÁPIDO - iATLAS SOLAR

## Pasos para Empezar en 5 Minutos

### 1. Inicia el Backend
```bash
cd backend
npm run dev
```
Espera a ver: `✅ Server running on http://localhost:3000`

### 2. Abre Terminal Nueva
```bash
cd frontend
npm run dev
```
Espera a ver: `Local: http://localhost:5173`

### 3. Abre tu Navegador
```
http://localhost:5173
```

### 4. Login
Usa tus credenciales

### 5. Ve a Pruebas OCR
```
Menú Sidebar → "Pruebas OCR" 🔬
o directamente: http://localhost:5173/testing/ocr
```

---

## ¿Qué Puedes Hacer?

### Tab 📊 Overview
Ver métricas en tiempo real:
- Total de tests
- Accuracy promedio
- Tiempo de procesamiento
- Gráfico de accuracy por campo
- Indicador GO/NO-GO

### Tab 📈 Resultados
Ver histórico completo de tests realizados

### Tab ⬆️ Upload
Subir un nuevo recibo:
1. Seleccionar PDF/Imagen del recibo
2. Seleccionar archivo JSON con valores correctos
3. Click "Ejecutar Test"
4. Ver resultado

### Tab 📦 Batches
Ver grupos de tests organizados

---

## 🎯 Objetivo Principal

Validar que OCR de recibos CFE funciona con **accuracy ≥ 92%**

- Si cumple → Proceder a FASE 1 (Multi-tenant)
- Si no cumple → Mejorar OCR + re-test

---

## 📝 Ejemplo Ground Truth JSON

```json
{
  "serviceNumber": "123456789012",
  "consumptionKWh": 245,
  "currentAmount": 1250.50,
  "billingPeriod": "2024-12",
  "dueDate": "2025-01-15"
}
```

---

## 🐛 Si Algo No Funciona

### Backend no inicia
```bash
# Verificar Node.js
node --version  # debe ser 18+

# Verificar dependencias
npm install

# Reintentar
npm run dev
```

### Frontend no carga
```bash
# Limpiar cache
rm -rf node_modules
npm install

# Reintentar
npm run dev
```

### Dashboard no muestra datos
```bash
# Verificar token
F12 → Console
localStorage.getItem('token')

# Si está vacío, login nuevamente
```

---

## 📚 Documentación

| Archivo | Para |
|---------|------|
| **DASHBOARD_GUIA_RAPIDA.md** | Empezar rápido |
| **OPCION_B_DASHBOARD.md** | Entender dashboard |
| **OPCION_A_COMPLETADA.md** | Datos guardados |
| **TESTING_FRAMEWORK.md** | Cómo funciona testing |
| **STATUS_COMPLETO.md** | Ver estado general |

---

## ✨ Features

✅ OCR automático (Tesseract)  
✅ Validación de precisión  
✅ Base de datos (PostgreSQL)  
✅ Dashboard visual  
✅ Gráficos en tiempo real  
✅ Histórico persistido  
✅ Decisión GO/NO-GO automática  

---

## 🎓 Próximos Pasos

1. Recopila 30+ recibos reales de CFE
2. Crea JSON con valores correctos (ground truth)
3. Sube cada recibo en Tab "Upload"
4. Revisa Tab "Overview" para ver progreso
5. Cuando accuracy ≥92% → ¡GO! 🚀

---

**¿Listo para empezar?**

```bash
cd backend && npm run dev &
cd frontend && npm run dev
```

Luego: http://localhost:5173 → Login → Menu → Pruebas OCR

¡Adelante! 🧪
