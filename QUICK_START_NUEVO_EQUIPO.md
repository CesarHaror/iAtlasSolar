# ⚡ Quick Start - Nuevo Equipo

**Tiempo estimado:** 15 minutos  
**Requisitos:** Node.js 18+, Git, Visual Studio Code + Copilot

## 1️⃣ Clonar Repositorio
```bash
git clone <repository-url> AtlasSolar
cd AtlasSolar
```

## 2️⃣ Instalar Backend
```bash
cd backend
npm install
# ⏳ Esperar completación (~2 min)

# Configurar .env (ver CONTINUACION_DESARROLLO.md para valores)
cp .env.example .env
nano .env  # Editar valores necesarios

# Iniciar
npm run dev
# ✅ Deberías ver: "🚀 iATLAS SOLAR - API Server" en localhost:5000
```

## 3️⃣ Instalar Frontend (en otra terminal)
```bash
cd frontend
npm install
# ⏳ Esperar completación (~2 min)

# Configurar variables
cp .env.example .env.local
# Por defecto VITE_API_URL=http://localhost:5000 funciona

# Iniciar
npm run dev
# ✅ Deberías ver: "VITE v..." en localhost:5173
```

## 4️⃣ Verificar Funcionamiento
```bash
# En el navegador
- Abrir: http://localhost:5173
- Navegar a: "Ver proyección" o "Nueva Cotización"
- Verficar que aparezcan 2 charts (CON/SIN Paneles) con:
  ✅ Barras verdes/rojas (consumo)
  ✅ Líneas superpuestas (costo)
  ✅ Promedios en tarjetas
  ✅ Ahorro total

# Verificar API
curl http://localhost:5000/api/ai/health
# Deberías recibir: {"status": "ok"}
```

## 5️⃣ Configurar Copilot en Visual Studio Code
1. Abrir extensiones (`Cmd+Shift+X`)
2. Instalar "GitHub Copilot" (microsoft.copilot)
3. Instalar "GitHub Copilot Chat" (github.copilot-chat)
4. Iniciar sesión con cuenta GitHub
5. En el editor: `Ctrl+K Ctrl+I` para chat inline

## 🔧 Troubleshooting Rápido

### Frontend no carga charts
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend no conecta
```bash
# Verificar que está corriendo
ps aux | grep "npm run dev" | grep backend

# Revisar logs de error
# Buscar "Advanced OCR service initialized"
```

### Puerto 5000/5173 ocupado
```bash
# En macOS, encontrar y matar proceso
lsof -i :5000
kill -9 <PID>

# O cambiar puerto en .env: PORT=5001
```

## 📝 Comandos Diarios

```bash
# Actualizar código
git pull origin main

# Crear rama para tu feature
git checkout -b feature/nombre

# Commit
git add .
git commit -m "feat: descripción breve"

# Push
git push origin feature/nombre
```

## 🎯 Checklist Visual
- [ ] Backend corre en localhost:5000
- [ ] Frontend corre en localhost:5173
- [ ] Puedo ver los 2 charts en "Ver proyección"
- [ ] Charts muestran barras + líneas simultáneamente
- [ ] Promedios de consumo/gasto aparecen
- [ ] Ahorro total se muestra correctamente
- [ ] Copilot está activo en VS Code

## 📚 Documentos Relacionados
- [Continuación Completa](./CONTINUACION_DESARROLLO.md) - Documentación detallada
- [Status Completo](./STATUS_COMPLETO.md) - Roadmap del proyecto
- Commit actual: `3a50939`

---
**Listo para empezar? 🚀**
