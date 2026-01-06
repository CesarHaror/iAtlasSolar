# 🎯 GUÍA PASO A PASO - Continuar en Otro Equipo

## 📋 ESTADO ACTUAL

✅ **Código completo:** Guardado en Git  
✅ **Documentación:** 4 archivos de guía  
✅ **Commits:** 5 nuevos guardados  
✅ **Dual-axis Charts:** Implementados y funcionando  

---

## 🚀 PASO 1: PREPARAR EL NUEVO EQUIPO (5 MIN)

### 1.1 Instalar requisitos
```bash
# Verificar Node.js (debe ser 18+ o 20.x)
node --version    # v18.17.0 o superior

# Verificar npm
npm --version     # 9.x o superior

# Verificar Git
git --version     # 2.x o superior
```

### 1.2 Abrir Visual Studio Code
```bash
# Si no está instalado
# Descargar desde: https://code.visualstudio.com

# Instalar extensiones Copilot
# - Abrir: Cmd+Shift+X
# - Buscar: "GitHub Copilot"
# - Instalar ambas (Copilot + Copilot Chat)
```

---

## 📁 PASO 2: CLONAR REPOSITORIO (5 MIN)

### 2.1 Clonar en Terminal
```bash
# Ir a donde quieras guardar el proyecto
cd /Users/TuUsuario/Documents

# Clonar (reemplaza <url> con URL real del repo)
git clone <url> AtlasSolar

# Entrar al directorio
cd AtlasSolar
```

### 2.2 Verificar que todo está ahí
```bash
# Ver archivos principales
ls -la

# Deberías ver:
# - backend/
# - frontend/
# - CONTINUACION_DESARROLLO.md
# - QUICK_START_NUEVO_EQUIPO.md
# - INDICE_DOCUMENTACION.md

# Ver commits guardados
git log --oneline -5
```

---

## 🖥️ PASO 3: CONFIGURAR BACKEND (10 MIN)

### 3.1 Instalar dependencias
```bash
cd backend

# Instalar paquetes
npm install

# ⏳ Esperar 1-2 minutos...
# Verás: "added XXX packages in Xs"
```

### 3.2 Configurar variables de entorno
```bash
# Crear archivo .env (copia del .env.example)
cp .env.example .env

# Editar el archivo
nano .env
# O en VS Code: Code → Open .env

# Valores necesarios:
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/atlas_solar
JWT_SECRET=tu-secret-muy-largo-y-aleatorio
TESSERACT_PATH=/usr/local/share/tessdata
```

### 3.3 Iniciar backend
```bash
# Desde carpeta backend/
npm run dev

# Deberías ver:
# 🚀 ═════════════════════════════════════
# iATLAS SOLAR - API Server
# 🌐 URL: http://localhost:5000
# 📡 Ambiente: development
```

**⚠️ IMPORTANTE:** No cierres esta terminal. El backend debe estar corriendo.

---

## 🎨 PASO 4: CONFIGURAR FRONTEND (10 MIN)

### 4.1 Abrir NUEVA terminal
```bash
# Ctrl+T en macOS terminal O
# Nueva ventana en VS Code

# Ir a la carpeta frontend
cd AtlasSolar/frontend
```

### 4.2 Instalar dependencias
```bash
npm install

# ⏳ Esperar 1-2 minutos...
```

### 4.3 Configurar variables
```bash
# Crear archivo .env.local
cp .env.example .env.local

# Ver/editar el archivo
cat .env.local

# Valores típicos (generalmente ya están):
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Atlas Solar
```

### 4.4 Iniciar frontend
```bash
# Desde carpeta frontend/
npm run dev

# Deberías ver:
# VITE v4.X.X  ready in XXX ms
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

**✅ AHORA TIENES AMBOS SERVIDORES CORRIENDO**

---

## 🌐 PASO 5: VERIFICAR EN NAVEGADOR (5 MIN)

### 5.1 Abrir la aplicación
```
Abrir navegador (Chrome, Safari, etc.)
Ir a: http://localhost:5173
```

### 5.2 Verificar que ves la aplicación
- ✅ Página de login o dashboard aparece
- ✅ No hay errores en rojo
- ✅ Interfaz se ve normal

### 5.3 Navegar a los charts
```
1. Clic en "Nueva Cotización" o "Ver Proyección"
2. Subir un recibo CFE (si pide)
3. Esperar a que procese
4. Deberías ver 2 CHARTS:
   ✅ CON Paneles (Verde): Barras bajas + Línea plana
   ✅ SIN Paneles (Rojo): Barras altas + Línea creciente
```

### 5.4 Verificar que se ven correctamente
```
Cada chart debe mostrar:
☑️ Barras de colores (consumo en kWh)
☑️ Línea superpuesta (costo en MXN)
☑️ 2 etiquetas en la derecha (kWh | MXN)
☑️ Tarjetas con promedios debajo
☑️ Ahorro total al pie
```

---

## 🧪 PASO 6: VALIDAR TODO FUNCIONA (5 MIN)

### 6.1 Test API
```bash
# En cualquier terminal, ejecutar:
curl http://localhost:5000/api/ai/health

# Deberías recibir:
{"status":"ok"}
```

### 6.2 Test Frontend
```
En navegador:
http://localhost:5173
↓
Debe cargar sin errores en consola (F12)
```

### 6.3 Test Charts
```
1. Navegar a Nueva Cotización
2. Si hay recibos de prueba, procesarlos
3. Verificar que aparecen los 2 charts
4. Verificar colores: Verde (CON) y Rojo (SIN)
```

---

## ✨ PASO 7: USAR COPILOT (OPCIONAL, 2 MIN)

### 7.1 Activar Copilot Chat
```
En VS Code:
- Abre cualquier archivo .tsx o .ts
- Presiona: Ctrl+K Ctrl+I
- Se abre chat inline
```

### 7.2 Prueba una pregunta
```
Escribe en el chat:
"¿Cómo puedo mejorar la visualización del chart de costos?"

Copilot te dará sugerencias automáticamente
```

### 7.3 Tips útiles
```
/help        → Ver comandos disponibles
@workspace   → Referirse al proyecto
@file        → Referirse a un archivo específico

Ejemplo: "@workspace cómo agrego un nuevo metric al chart"
```

---

## 📚 PASO 8: ENTENDER EL CÓDIGO (OPCIONAL)

### 8.1 Abrir archivos modificados
```
VS Code → File → Open Folder → AtlasSolar

Luego abre estos archivos:
1. frontend/src/components/quotations/ConsumptionProjectionCharts.tsx
2. frontend/src/components/quotations/CFEReceiptUploadMultiple.tsx
```

### 8.2 Explorar cambios
```
En VS Code:
- Click derecho en archivo
- "Open Changes" (muestra lo modificado)
- Puedes ver qué se cambió vs. versión anterior
```

### 8.3 Ver documentación
```
En VS Code o Terminal:
cd AtlasSolar

# Leer guía completa
cat CONTINUACION_DESARROLLO.md

# Ver resumen técnico
cat RESUMEN_ULTIMOS_CAMBIOS.md

# Ver índice
cat INDICE_DOCUMENTACION.md
```

---

## 🐛 PASO 9: TROUBLESHOOTING (SI ALGO FALLA)

### Problema: "Puerto 5000 ya está en uso"
```bash
# Encontrar proceso
lsof -i :5000

# Matar proceso (reemplaza PID)
kill -9 <PID>

# O cambiar puerto en backend/.env
PORT=5001
```

### Problema: "Port 5173 already in use"
```bash
# Encontrar
lsof -i :5173

# Matar
kill -9 <PID>
```

### Problema: "npm install falla"
```bash
# Limpiar cache
npm cache clean --force

# Reinstalar
rm -rf node_modules package-lock.json
npm install --force
```

### Problema: "Charts no se ven"
```bash
# Borrar cache navegador
Cmd+Shift+R (hard refresh)

# O en Terminal frontend:
npm run dev
# Verá qué errores hay
```

### Problema: "Backend no responde"
```bash
# Verificar que está corriendo
ps aux | grep "npm run dev" | grep backend

# Ver logs
# Buscar "Advanced OCR service initialized"
```

---

## 🎓 PASO 10: PRÓXIMOS PASOS DE DESARROLLO

### Cuando todo funcione:

**Semana 1:**
- [ ] Testing manual con recibos reales
- [ ] Validar cálculos de ahorro
- [ ] Crear casos de prueba

**Semana 2:**
- [ ] Implementar métodos de pago
- [ ] Agregar opciones de financiamiento
- [ ] Mostrar ROI

**Semana 3:**
- [ ] Exportación a PDF
- [ ] Email de propuestas
- [ ] Dashboard administrativo

---

## 📝 CHECKLIST FINAL

Marca cada ítem cuando esté completo:

```
CONFIGURACIÓN:
☐ Node.js 18+ instalado
☐ Git funcionando
☐ VS Code + Copilot instalado
☐ Repo clonado

BACKEND:
☐ npm install completado
☐ .env configurado
☐ Servidor corriendo en :5000
☐ API health check OK

FRONTEND:
☐ npm install completado
☐ .env.local configurado
☐ Servidor corriendo en :5173
☐ Aplicación carga en navegador

VALIDACIÓN:
☐ Charts visibles
☐ Colores correctos (verde/rojo)
☐ Promedios mostrados
☐ Ahorro total visible

¡LISTO PARA DESARROLLAR!
```

---

## 🔗 RECURSOS RÁPIDOS

| Necesidad | Comando |
|-----------|---------|
| Ver código | `code .` (desde AtlasSolar) |
| Ver logs backend | `npm run dev` en carpeta backend |
| Ver logs frontend | `npm run dev` en carpeta frontend |
| Actualizar código | `git pull origin main` |
| Crear nueva rama | `git checkout -b feature/nombre` |
| Ver cambios | `git status` |
| Hacer commit | `git add . && git commit -m "mensaje"` |

---

## 📞 AYUDA RÁPIDA

```bash
# ¿Dónde estoy?
pwd

# ¿Qué hay en esta carpeta?
ls -la

# ¿Está corriendo algo en :5000?
lsof -i :5000

# ¿Hay cambios sin guardar?
git status

# ¿Cuáles fueron mis últimos cambios?
git log --oneline -5
```

---

## ✅ FELICIDADES

Si llegaste aquí, ¡ya tienes todo configurado!

**Lo que acabas de hacer:**
1. ✅ Configurar backend Node.js
2. ✅ Configurar frontend React + Vite
3. ✅ Verificar que ambos servidores corren
4. ✅ Ver los charts funcionar en vivo
5. ✅ Preparar Copilot para desarrollo

**Ahora puedes:**
- 🚀 Continuar el desarrollo
- 🐛 Hacer debugging
- ✨ Agregar nuevas features
- 📈 Mejorar visualizaciones
- 💾 Hacer commits y push

---

**Tiempo total:** ~45 minutos  
**Estado:** ✅ LISTO PARA PRODUCCIÓN  
**Próximo paso:** Lee [CONTINUACION_DESARROLLO.md](./CONTINUACION_DESARROLLO.md) para features futuras

¡A programar! 🎉
