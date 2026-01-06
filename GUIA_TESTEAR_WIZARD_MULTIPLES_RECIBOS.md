# 🚀 GUÍA RÁPIDA: Testear Nuevo Wizard con Múltiples Recibos

**Fecha:** 2 de enero de 2026  
**Objetivo:** Validar que el OCR integrado funciona correctamente con múltiples recibos

---

## 📋 Antes de Empezar

✅ Backend corriendo en `http://localhost:3000`  
✅ Frontend corriendo en `http://localhost:5173`  
✅ Tienes 1+ recibos PDF reales de CFE (del MISMO número de servicio)

---

## 🎯 Pasos para Probar

### 1. Acceder al Wizard
```
URL: http://localhost:5173/quotations/new
O desde menú: Cotizaciones → Nueva Cotización
```

### 2. Ver el Paso 1: "Sube el Recibo CFE"
```
Deberías ver:
- Área de drag & drop con mensaje:
  "Puedes subir 1 o múltiples recibos del MISMO número de servicio"
- Instrucción clara sobre número de servicio
```

### 3. Subir Recibos (Opción A: Drag & Drop)
```
1. Arrastra 1+ PDFs a la zona de upload
2. Los recibos aparecen en lista
3. Cada uno muestra:
   - Nombre del archivo
   - Tamaño en KB
   - Estado (Pendiente)
```

### 3b. Subir Recibos (Opción B: Click)
```
1. Click en la zona (o botón "Agregar más")
2. Selecciona archivos del explorador
3. Confirma
```

### 4. Analizar Recibos
```
Opción 1: Botón individual "Analizar"
- Click en cada recibo
- Se analizan uno por uno

Opción 2: Botón "Analizar Todos"
- Analiza todos los pendientes de una vez
```

### 5. Esperar Análisis
```
Durante el análisis:
- Icono de loading
- Barra de progreso opcional
- Estado: "Analizando..."

Después:
- Icono de ✅ si éxito
- Icono de ❌ si error
- Muestra confianza (ej: 85%)
```

### 6. Ver Datos Extraídos (Por Recibo)
```
Para cada recibo analizado exitosamente:
┌─────────────────────────────────┐
│ Consumo: 245 kWh                │
│ Gasto: $1,250                   │
│ Confianza: 85%                  │
└─────────────────────────────────┘
```

### 7. Validación de Número de Servicio
```
Si TODOS los recibos son del MISMO número:
✅ "Validación OK - Todos los recibos son del servicio 123456789012"

Si hay recibos DIFERENTES:
❌ "⚠️ Este recibo tiene DIFERENTE número de servicio (987654321098)"
   → No podrás continuar hasta remover el recibo incorrecto
```

### 8. Ver Promedios (Si 2+ Recibos)
```
Si subiste múltiples recibos exitosamente:
┌──────────────────────────────────────────┐
│ Consumo Promedio: 250 kWh/mes            │
│ Gasto Promedio: $1,275/mes               │
│ Períodos Analizados: 3                   │
│ Tendencia: ↗ Aumentando                  │
└──────────────────────────────────────────┘
```

### 9. Botón "Continuar"
```
Aparece cuando:
✓ Al menos 1 recibo analizado exitosamente
✓ Todos los números de servicio son iguales
✓ Datos listos para cotizar

Click:
→ Avanza a paso 2 (Cliente ya pre-seleccionado)
→ Datos de consumo ya pre-llenados
→ Tarifa ya pre-seleccionada
```

### 10. Verificar Cliente Auto-Seleccionado
```
Paso 2: "Cliente y Consumo"
- Cliente ya seleccionado (si existía)
- O botón para crear nuevo cliente
- Consumo mensual: pre-llenado con promedio
- Tarifa: pre-seleccionada
```

### 11. Configurar e Ir a Resultados
```
Paso 3: Configuración
- Tipo instalación (techo, piso, etc.)
- Equipamiento (estándar u otro)

Paso 4: Resultados
- Cálculos solares completados
- PDF descargable listo
```

---

## 🧪 Casos de Prueba

### ✅ Caso 1: Un Recibo Simple
```
Pasos:
1. Sube 1 PDF de CFE
2. Click "Analizar"
3. Espera análisis
4. Ver datos extraídos
5. Click "Continuar"
6. Verifica cliente/consumo pre-llenado

Resultado esperado:
✓ Recibo analizado correctamente
✓ Datos pre-llenados en paso 2
```

### ✅ Caso 2: Múltiples Recibos (Mismo Servicio)
```
Pasos:
1. Sube 3 PDFs del MISMO número
2. Click "Analizar Todos"
3. Espera a que se analicen todos
4. Ver promedios calculados
5. Click "Continuar"

Resultado esperado:
✓ Muestra consumo promedio
✓ Muestra gasto promedio
✓ Detecta tendencia
✓ Todos validados OK
```

### ❌ Caso 3: Múltiples Recibos (Diferentes Servicios)
```
Pasos:
1. Sube 2 PDFs de diferentes números
2. Click "Analizar Todos"
3. Después del análisis, uno falla validación

Resultado esperado:
✓ Muestra alerta en rojo
✓ Botón "Continuar" deshabilitado
✓ Opción: remover recibo incorrecto
```

### ⚠️ Caso 4: Recibo con Baja Confianza
```
Pasos:
1. Sube un PDF de mala calidad
2. OCR analiza pero confianza < 70%
3. Muestra advertencia amarilla

Resultado esperado:
✓ Análisis completa
✓ Muestra alerta de baja confianza
✓ Puedes revisar manualmente los datos
```

### ⚠️ Caso 5: Error de Análisis
```
Pasos:
1. Sube un PDF que no es recibo CFE
2. OCR intenta analizar

Resultado esperado:
✓ Estado cambia a rojo (Error)
✓ Muestra mensaje de error
✓ Opción: remover y subir otro
```

---

## 📊 Qué Buscar en Cada Recibo

El OCR debe extraer estos datos:
```
✅ Número de servicio CFE
✅ Consumo mensual (kWh)
✅ Monto a pagar
✅ Tarifa (T1, DAC, 1A, etc.)
✅ Ubicación (ciudad, estado)
✅ Nombre del cliente (opcional pero deseable)
✅ Dirección (opcional pero deseable)
```

Si falta alguno:
- ⚠️ El sistema avisa "Algunos datos pueden ser incorrectos"
- Puedes editar manualmente en paso 2

---

## 🔍 Debugging

### Si el análisis falla:
```
1. Abre DevTools (F12)
2. Ve a Console
3. Busca mensajes de error
4. Verifica que el backend esté corriendo
   curl http://localhost:3000/api/health
```

### Si los datos están mal:
```
1. Ve a Paso 2 (Cliente)
2. Edita manualmente los valores
3. Continúa
```

### Si el cliente no se crea:
```
1. El modal para crear cliente debería aparecer
2. Si no aparece, crea manualmente desde:
   Menú → Clientes → Nuevo Cliente
3. Luego vuelve al wizard y busca el cliente
```

---

## 📝 Verificación Checklist

Después de probar:

- [ ] Upload múltiple funciona (drag & drop)
- [ ] Validación de número de servicio funciona
- [ ] Promedios se calculan correctamente
- [ ] Cliente se auto-selecciona o crea
- [ ] Datos pre-se llenan en paso 2
- [ ] Cálculos solares funcionan
- [ ] PDF se genera correctamente
- [ ] No hay errores en consola

---

## 🎯 Métricas de Éxito

Después de testear con 5+ recibos reales:

- **Accuracy OCR:** ≥70% confianza promedio
- **Tiempo de procesamiento:** <2 segundos por recibo
- **Exactitud de datos:** Comparar manual vs extracción
- **Flujo completo:** Recibo → Cotización en <3 minutos

---

## 📞 Próximos Pasos

Una vez validados los casos:

1. Testear con 30+ recibos reales de CFE
2. Medir accuracy ≥92%
3. Si cumple: **GO para FASE 1**
4. Si no cumple: Mejorar OCR config

---

## 💡 Notas Importantes

### ⚠️ Números de Servicio Diferentes
Si el usuario sube recibos de dos números diferentes:
- Sistema valida y avisa
- Usuario debe remover el incorrecto
- Explicación: Cálculos solares son por ubicación específica

### 📊 Promedios Multi-Recibo
Si subes 12 meses de recibos:
- Sistema calcula consumo promedio
- Sistema calcula gasto promedio
- Sistema detecta tendencia (↗ o ↘)
- Esto hace los cálculos solares más precisos

### 🤖 Auto-Selección de Cliente
Si el número de servicio ya existe en BD:
- Cliente se selecciona automáticamente
- No necesitas buscarlo manualmente

---

**¿Listo para empezar? ¡Adelante! 🚀**

Recolecta recibos reales CFE y comienza a validar.
