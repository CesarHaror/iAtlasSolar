# 🌞 iAtlas Solar - Sistema de Cotización Solar con IA

Sistema profesional y completo para gestión de cotizaciones de energía solar, incluyendo análisis automático de recibos CFE con OCR, cálculos inteligentes, generación de PDF premium y seguimiento de proyectos.

**Estado:** v1.0 - Prototipo completo funcional ✨

---

## ✨ Características Principales

- ✅ **Análisis de Recibos CFE con OCR (Gratis, Open Source)**
  - Extrae automáticamente consumo, tarifa, monto
  - Detecta cliente, dirección, estado
  - Confianza nivel 85-99%

- ✅ **Cálculos Solares Inteligentes**
  - Tarifa detection automático (T1, T1A-F, GDMTO, GDMTH, DAC)
  - Payback en meses (exacto)
  - ROI a 25 años
  - Ahorro mensual (avgBill - monthlyBillAfter)
  - $8,500 por panel incluye material + instalación

- ✅ **Cotizaciones Profesionales**
  - Generación de PDF con branding
  - Desglose de costos transparente
  - Descuentos automáticos
  - Disclaimer de variaciones

- ✅ **Gestión Completa**
  - Autenticación JWT con roles (Admin, Vendedor)
  - Gestión de clientes con historial
  - Catálogo de productos (paneles, inversores)
  - Seguimiento de proyectos post-venta
  - Dashboard con métricas en tiempo real

- ✅ **Seguridad y Performance**
  - Base de datos PostgreSQL
  - API REST robusta
  - TypeScript en Frontend y Backend
  - Manejo de errores completo

---

## 🏗️ Estructura del Proyecto

```
iAtlasSolar/
├── backend/                          # API REST con Express + TypeScript
│   ├── prisma/
│   │   ├── schema.prisma             # Esquema de base de datos
│   │   └── seed.ts                   # Datos iniciales
│   ├── src/
│   │   ├── config/                   # Configuraciones (BD, email, constantes)
│   │   ├── modules/                  # Módulos principales
│   │   │   ├── auth/                 # Autenticación JWT
│   │   │   ├── quotations/           # Cotizaciones
│   │   │   ├── calculator/           # Cálculos solares
│   │   │   ├── ocr/                  # OCR de recibos CFE (pdf-parse)
│   │   │   ├── pdf/                  # Generación de PDFs
│   │   │   ├── clients/              # Gestión de clientes
│   │   │   ├── catalog/              # Catálogo de productos
│   │   │   ├── proformas/            # Proformas
│   │   │   ├── projects/             # Proyectos
│   │   │   └── notifications/        # Emails y WhatsApp
│   │   ├── shared/                   # Middleware, errores, utils
│   │   └── index.ts                  # Entrada principal
│   ├── .env.example                  # Variables de entorno (ejemplo)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                         # SPA con React + Vite + TypeScript
│   ├── src/
│   │   ├── components/               # Componentes reutilizables
│   │   ├── hooks/                    # Custom hooks (useQuotations, useOCR, etc)
│   │   ├── layouts/                  # MainLayout
│   │   ├── lib/                      # API client, utils
│   │   ├── pages/                    # Páginas/Vistas
│   │   ├── stores/                   # Estado global (authStore)
│   │   ├── App.tsx                   # Rutas principales
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── uploads/                          # Carpeta para archivos subidos
├── .gitignore
├── README.md
└── package.json (root)
```

---

## 🚀 Guía de Instalación Completa

### 📋 Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

- **Node.js 18+** - Descarga desde [nodejs.org](https://nodejs.org)
  ```bash
  node --version  # v18.0.0 o superior
  npm --version   # 9.0.0 o superior
  ```

- **PostgreSQL 14+** - Descarga desde [postgresql.org](https://www.postgresql.org/download/)
  ```bash
  psql --version  # PostgreSQL 14.0 o superior
  ```

- **Git** - Descarga desde [git-scm.com](https://git-scm.com)

### Paso 1️⃣: Clonar el Repositorio

```bash
# Clonar desde GitHub
git clone https://github.com/CesarHaror/iAtlasSolar.git
cd iAtlasSolar

# O clona con SSH (si tienes configurado)
git clone git@github.com:CesarHaror/iAtlasSolar.git
cd iAtlasSolar
```

### Paso 2️⃣: Configurar Base de Datos PostgreSQL

```bash
# 1. Crear base de datos
psql -U postgres -c "CREATE DATABASE atlas_solar;"

# 2. (Opcional) Crear usuario específico
psql -U postgres -c "CREATE USER atlas_user WITH PASSWORD 'atlas_password';"
psql -U postgres -c "ALTER ROLE atlas_user WITH CREATEDB;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE atlas_solar TO atlas_user;"
```

**O si prefieres usar pgAdmin:**
1. Abre pgAdmin
2. Clic derecho en "Databases" → "Create" → "Database"
3. Nombre: `atlas_solar`
4. Guarda

### Paso 3️⃣: Configurar Variables de Entorno

```bash
# Ir a carpeta backend
cd backend

# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores
nano .env  # o usa tu editor favorito
```

**Contenido de `.env` (ejemplo):**
```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/atlas_solar"

# Puerto del servidor
PORT=5000

# JWT para autenticación
JWT_SECRET="tu-secreto-super-seguro-aqui-cambialo"
JWT_EXPIRE="24h"

# Email (para envíos, opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña-app

# URL del Frontend
FRONTEND_URL=http://localhost:5173

# Ambiente
NODE_ENV=development
```

### Paso 4️⃣: Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Esperado: ~600 paquetes instalados en 2-3 minutos
```

```bash
# Frontend (en otra carpeta/terminal)
cd frontend
npm install

# Esperado: ~400 paquetes instalados en 1-2 minutos
```

### Paso 5️⃣: Configurar Base de Datos con Prisma

```bash
# Desde carpeta backend

# 1. Generar cliente Prisma
npm run db:generate

# 2. Crear/actualizar tablas en PostgreSQL
npm run db:push

# 3. Poblar con datos iniciales (usuarios, productos, etc)
npm run db:seed
```

**Output esperado:**
```
✔ Generated Prisma Client
✔ Database synchronized
🌱 Iniciando seed...
   ✅ Admin creado
   ✅ Vendedor creado
   ✅ Ciudades y HSP creados
   ✅ Paneles solares creados
   ✅ Inversores creados
   ✅ Configuraciones creadas
✅ Seed completado exitosamente
```

### Paso 6️⃣: Iniciar el Sistema

Necesitas **2 terminales abiertas**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev

# Output:
# 🌞 iAtlas Solar API iniciado
# ✅ Conectado a PostgreSQL
# 🚀 Servidor ejecutándose en http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev

# Output:
# ➜  Local:   http://localhost:5173/
# ➜  Network: http://tu-ip:5173/
# ➜  press h to show help
```

### Paso 7️⃣: Acceder al Sistema

Abre en tu navegador:

- **🔗 Frontend:** [http://localhost:5173](http://localhost:5173)
- **📡 Backend API:** [http://localhost:5000](http://localhost:5000)
- **🗄️ Prisma Studio:** `npm run db:studio` → [http://localhost:5555](http://localhost:5555)

---

## 🔐 Credenciales de Prueba

Una vez el sistema esté corriendo, usa estas credenciales:

```
👤 Admin
Email:    admin@atlassolar.mx
Password: Admin123!

👤 Vendedor
Email:    vendedor@atlassolar.mx
Password: Admin123!
```

---

## 🛠️ Stack Tecnológico Completo

### Backend (Node.js + Express)

**Core:**
```json
{
  "express": "4.x",
  "typescript": "5.x",
  "dotenv": "16.x"
}
```

**Base de Datos:**
```json
{
  "@prisma/client": "5.x",
  "postgresql": "14+"
}
```

**Autenticación:**
```json
{
  "jsonwebtoken": "9.x",
  "bcryptjs": "2.x"
}
```

**Validación:**
```json
{
  "zod": "3.x"
}
```

**PDF & OCR:**
```json
{
  "handlebars": "4.x",
  "puppeteer": "21.x",
  "pdf-parse": "1.x"
}
```

**Desarrollo:**
```json
{
  "ts-node": "10.x",
  "nodemon": "3.x",
  "@types/node": "20.x"
}
```

### Frontend (React + Vite)

**Core:**
```json
{
  "react": "18.x",
  "react-dom": "18.x",
  "vite": "5.x",
  "typescript": "5.x"
}
```

**Enrutamiento & Estado:**
```json
{
  "react-router-dom": "6.x",
  "zustand": "4.x",
  "@tanstack/react-query": "5.x"
}
```

**Formularios:**
```json
{
  "react-hook-form": "7.x",
  "zod": "3.x"
}
```

**UI & Estilos:**
```json
{
  "tailwindcss": "3.x",
  "lucide-react": "0.x",
  "react-hot-toast": "2.x"
}
```

---

## 📚 API Endpoints Principales

### Autenticación
```
POST   /api/auth/login              Login con email/password
POST   /api/auth/register           Registro (solo admin)
POST   /api/auth/verify             Verificar token JWT
GET    /api/auth/profile            Obtener perfil actual
PUT    /api/auth/profile            Actualizar perfil
PUT    /api/auth/change-password    Cambiar contraseña
```

### Cotizaciones
```
GET    /api/quotations              Listar todas las cotizaciones
POST   /api/quotations              Crear nueva cotización
GET    /api/quotations/:id          Obtener cotización por ID
PUT    /api/quotations/:id          Actualizar cotización
DELETE /api/quotations/:id          Eliminar cotización
POST   /api/quotations/:id/send     Enviar por email
GET    /api/quotations/:id/pdf      Descargar PDF
POST   /api/quotations/:id/copy     Duplicar cotización
```

### OCR (Análisis de Recibos)
```
POST   /api/ocr/analyze-receipt           Analizar PDF del recibo
POST   /api/ocr/analyze-receipt-base64    Analizar desde base64
GET    /api/ocr/status                    Estado del servicio OCR
```

### Clientes
```
GET    /api/clients                 Listar clientes
POST   /api/clients                 Crear cliente
GET    /api/clients/:id             Obtener cliente
PUT    /api/clients/:id             Actualizar cliente
DELETE /api/clients/:id             Eliminar cliente
```

### Catálogo
```
GET    /api/catalog/panels          Listar paneles solares
GET    /api/catalog/inverters       Listar inversores
GET    /api/catalog/locations       Listar ciudades/HSP
```

---

## 📦 Scripts Disponibles

### Backend

```bash
npm run dev              # Iniciar en modo desarrollo (con hot-reload)
npm run build            # Compilar TypeScript a JavaScript
npm run start            # Ejecutar build en producción

# Base de datos
npm run db:generate      # Generar Prisma Client
npm run db:push          # Sincronizar esquema con BD
npm run db:migrate:dev   # Crear migración de desarrollo
npm run db:seed          # Ejecutar seed inicial
npm run db:studio        # Abrir Prisma Studio (UI de BD)
npm run db:reset         # ⚠️ Resetear BD completamente
```

### Frontend

```bash
npm run dev              # Iniciar servidor dev con Vite
npm run build            # Compilar para producción
npm run preview          # Preview del build
npm run lint             # Ejecutar ESLint (si está configurado)
```

---

## 🎯 Flujo de Uso Completo

### Crear Cotización

```
1. Usuario (Vendedor) abre "Nueva Cotización"
   ↓
2. Sube recibo CFE (PDF)
   ↓
3. OCR extrae automáticamente:
   • Consumo (kWh)
   • Tarifa (T1, GDMTO, etc)
   • Recibo actual ($)
   • Nombre/Dirección cliente
   ↓
4. Sistema llena formulario automáticamente
   ↓
5. Ajusta parámetros si es necesario
   ↓
6. Sistema calcula:
   • Paneles necesarios
   • Sistema kW
   • Ahorro mensual
   • Payback (meses)
   • ROI (25 años)
   ↓
7. Genera PDF profesional
   ↓
8. Envía por email al cliente
   ↓
9. Estado actualiza a "ENVIADA"
```

### PDF Generado Incluye

```
✓ Desglose de costos ($8,500/panel)
✓ Ahorro mensual estimado
✓ Payback en meses
✓ ROI a 25 años
✓ Impacto ambiental (CO₂, árboles)
✓ Especificaciones técnicas
✓ Términos y condiciones
✓ Disclaimer de variaciones
✓ Branding de la empresa
```

---

## ⚠️ Solución de Problemas

### Error: `connect ECONNREFUSED 127.0.0.1:5432`
**Problema:** PostgreSQL no está corriendo  
**Solución:**
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows - Usa pgAdmin o SQL Shell
```

### Error: `Module not found: pdf-parse`
**Problema:** Dependencia no instalada  
**Solución:**
```bash
cd backend
npm install pdf-parse
```

### Error: `DATABASE_URL not defined`
**Problema:** Variables de entorno no configuradas  
**Solución:**
```bash
cd backend
cp .env.example .env
# Edita .env con tus valores
```

### Base de datos vacía
**Problema:** Seed no ejecutado  
**Solución:**
```bash
cd backend
npm run db:seed
```

### Frontend no conecta al Backend
**Problema:** API URL incorrecta o Backend no corre  
**Solución:**
```bash
# Verifica que Backend esté corriendo
curl http://localhost:5000

# Verifica que Frontend tenga URL correcta
# En frontend/src/lib/api.ts debe estar:
# baseURL: 'http://localhost:5000'
```

---

## 🚀 Deploy (Próximos Pasos)

### Preparar para Producción

1. **Backend (Railway, Render, Heroku)**
   ```bash
   npm run build
   npm start
   ```
   Variables de entorno en hosting:
   - DATABASE_URL (PostgreSQL en la nube)
   - JWT_SECRET (nuevo valor seguro)
   - NODE_ENV=production
   - FRONTEND_URL (tu dominio frontend)

2. **Frontend (Vercel, Netlify)**
   ```bash
   npm run build
   # Output en carpeta 'dist/'
   ```
   Configurar:
   - VITE_API_URL=https://tu-api.com

3. **Base de Datos (Supabase, Railway, Cloud SQL)**
   - Crea PostgreSQL en la nube
   - Update DATABASE_URL
   - Ejecuta: `npm run db:push`

---

## 📞 Soporte

¿Preguntas o encontraste un bug?

- 📧 Email: cesar.haror@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/CesarHaror/iAtlasSolar/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/CesarHaror/iAtlasSolar/discussions)

---

## 📄 Licencia

MIT License - Eres libre de usar, modificar y distribuir este proyecto.

---

<div align="center">

**Desarrollado con ☀️ por iAtlas Solar**

Transformando la energía solar en soluciones inteligentes

[⭐ Si te gusta, dale una estrella en GitHub!](https://github.com/CesarHaror/iAtlasSolar)

</div>
