# 🌞 iAtlas Solar - Sistema de Cotización Solar

Sistema completo para gestión de cotizaciones de energía solar, incluyendo cálculos automáticos, generación de PDF y seguimiento de proyectos.

## 📋 Características

- ✅ **Autenticación JWT** con roles (Admin, Vendedor, Instalador)
- ✅ **Cálculos solares automáticos** basados en consumo CFE
- ✅ **Gestión de clientes** con historial de cotizaciones
- ✅ **Cotizaciones profesionales** con generación de PDF
- ✅ **Catálogo de productos** (paneles, inversores)
- ✅ **Seguimiento de proyectos** post-venta
- ✅ **Dashboard con métricas** en tiempo real

## 🏗️ Estructura del Proyecto

```
AtlasSolar/
├── backend/                 # API REST con Express + TypeScript
│   ├── prisma/             # Esquema de BD y migraciones
│   ├── src/
│   │   ├── config/         # Configuraciones
│   │   ├── modules/        # Módulos (auth, quotations, etc.)
│   │   └── shared/         # Middleware, errores, utils
│   └── package.json
│
├── frontend/               # SPA con React + Vite + TypeScript
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── hooks/          # Custom hooks
│   │   ├── layouts/        # Layouts de página
│   │   ├── lib/            # Utilidades y API client
│   │   ├── pages/          # Páginas/Vistas
│   │   └── stores/         # Estado global (Zustand)
│   └── package.json
│
└── README.md
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### 1. Clonar y configurar

```bash
# Clonar el repositorio
git clone <tu-repo>
cd AtlasSolar

# Configurar variables de entorno del backend
cd backend
cp .env.example .env
# Editar .env con tus credenciales de BD
```

### 2. Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configurar base de datos

```bash
cd backend

# Generar cliente de Prisma
npm run db:generate

# Crear tablas en la BD
npm run db:push

# Poblar con datos iniciales
npm run db:seed
```

### 4. Iniciar en desarrollo

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Acceder al sistema

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Prisma Studio:** `npm run db:studio` (http://localhost:5555)

### Credenciales de prueba

```
Admin:    admin@atlassolar.mx / Admin123!
Vendedor: vendedor@atlassolar.mx / Admin123!
```

## 📚 API Endpoints

### Autenticación
```
POST   /api/auth/login          # Iniciar sesión
POST   /api/auth/register       # Registrar usuario (admin)
GET    /api/auth/profile        # Obtener perfil
PUT    /api/auth/profile        # Actualizar perfil
PUT    /api/auth/change-password # Cambiar contraseña
POST   /api/auth/verify         # Verificar token
```

### Cotizaciones (próximamente)
```
GET    /api/quotations          # Listar cotizaciones
POST   /api/quotations          # Crear cotización
GET    /api/quotations/:id      # Obtener cotización
PUT    /api/quotations/:id      # Actualizar cotización
POST   /api/quotations/:id/send # Enviar cotización
```

### Clientes (próximamente)
```
GET    /api/clients             # Listar clientes
POST   /api/clients             # Crear cliente
GET    /api/clients/:id         # Obtener cliente
PUT    /api/clients/:id         # Actualizar cliente
```

## 🔧 Tecnologías

### Backend
- **Express.js** - Framework web
- **TypeScript** - Tipado estático
- **Prisma** - ORM para PostgreSQL
- **JWT** - Autenticación
- **Zod** - Validación de schemas
- **Bcrypt** - Hash de contraseñas

### Frontend
- **React 18** - UI Library
- **Vite** - Build tool
- **TypeScript** - Tipado estático
- **TailwindCSS** - Estilos
- **React Router** - Enrutamiento
- **Zustand** - Estado global
- **React Query** - Cache y fetching
- **React Hook Form + Zod** - Formularios

## 📦 Scripts Disponibles

### Backend
```bash
npm run dev          # Iniciar en desarrollo
npm run build        # Compilar a JavaScript
npm run start        # Iniciar en producción
npm run db:generate  # Generar cliente Prisma
npm run db:push      # Sincronizar BD
npm run db:migrate   # Crear migración
npm run db:seed      # Poblar datos iniciales
npm run db:studio    # Abrir Prisma Studio
```

### Frontend
```bash
npm run dev          # Iniciar en desarrollo
npm run build        # Compilar para producción
npm run preview      # Preview de build
npm run lint         # Ejecutar linter
```

## 🗺️ Roadmap

- [x] Paso 1: Setup proyecto + BD + Auth
- [ ] Paso 2: Módulo de clientes CRUD
- [ ] Paso 3: Calculadora solar + API tarifas
- [ ] Paso 4: Módulo cotizaciones
- [ ] Paso 5: Generación PDF
- [ ] Paso 6: Email + WhatsApp
- [ ] Paso 7: Dashboard + reportes
- [ ] Paso 8: Testing + deploy

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

---

Desarrollado con ☀️ por iAtlas Solar
