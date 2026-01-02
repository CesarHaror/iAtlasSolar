// =====================================================
// ATLAS SOLAR - SERVIDOR PRINCIPAL
// Sistema de Cotización de Energía Solar
// =====================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './shared/middleware/index.js';

// Importar rutas
import { authRoutes } from './modules/auth/index.js';
import { clientRoutes } from './modules/clients/index.js';
import { quotationRoutes } from './modules/quotations/index.js';
import { pdfRoutes } from './modules/pdf/index.js';
import { notificationRoutes } from './modules/notifications/index.js';
import proformaRoutes from './modules/proformas/proforma.routes.js';
import projectRoutes from './modules/projects/project.routes.js';
import catalogRoutes from './modules/catalog/catalog.routes.js';
import configRoutes from './modules/config/config.routes.js';
import uploadRoutes from './modules/upload/upload.routes.js';
import ocrRoutes from './modules/ocr/ocr.routes.js';

// Crear aplicación Express
const app = express();

// =====================================================
// MIDDLEWARE DE SEGURIDAD
// =====================================================

// Helmet - Headers de seguridad
app.use(helmet());

// CORS - Permitir múltiples orígenes en desarrollo
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://192.168.100.44:5173',
  'http://192.168.100.44:5174',
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // En desarrollo permitir todo
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting general
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Demasiadas solicitudes, intenta más tarde',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Rate limiting específico para auth (más estricto)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 intentos de login
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Demasiados intentos de login, intenta en 15 minutos',
    },
  },
});

// =====================================================
// MIDDLEWARE DE PARSING
// =====================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =====================================================
// ARCHIVOS ESTÁTICOS (para PDFs generados)
// =====================================================

app.use('/uploads', express.static('uploads'));
app.use('/pdfs', express.static('pdfs'));

// =====================================================
// RUTAS DE SALUD
// =====================================================

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'iAtlas Solar API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenido a iAtlas Solar API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      quotations: '/api/quotations',
      clients: '/api/clients',
      projects: '/api/projects',
      catalog: '/api/catalog',
    },
  });
});

// =====================================================
// RUTAS DE LA API
// =====================================================

// Auth con rate limiting específico
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);

// Clientes
app.use('/api/clients', clientRoutes);

// Cotizaciones
app.use('/api/quotations', quotationRoutes);

// PDFs (para cotizaciones y otros documentos)
app.use('/api', pdfRoutes);

// Notificaciones (Email y WhatsApp)
app.use('/api', notificationRoutes);

// Proformas (Prefacturas)
app.use('/api/proformas', proformaRoutes);

// Proyectos
app.use('/api/projects', projectRoutes);

// Catálogo de productos
app.use('/api/catalog', catalogRoutes);

// Configuración del sistema
app.use('/api/config', configRoutes);

// Upload de archivos
app.use('/api/upload', uploadRoutes);

// OCR - Análisis de recibos CFE
app.use('/api/ocr', ocrRoutes);

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// Ruta no encontrada
app.use(notFoundHandler);

// Manejador global de errores
app.use(errorHandler);

// =====================================================
// INICIAR SERVIDOR
// =====================================================

const PORT = config.port;

app.listen(PORT, () => {
  console.log('\n🚀 ═══════════════════════════════════════════════════════');
  console.log('   ATLAS SOLAR - API Server');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   🌐 URL:         http://localhost:${PORT}`);
  console.log(`   📡 Ambiente:    ${config.nodeEnv}`);
  console.log(`   🔗 Frontend:    ${config.frontendUrl}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   📚 Endpoints disponibles:');
  console.log(`      GET  /health          - Estado del servidor`);
  console.log(`      GET  /api             - Info de la API`);
  console.log(`      POST /api/auth/login  - Iniciar sesión`);
  console.log(`      GET  /api/auth/profile - Perfil de usuario`);
  console.log('═══════════════════════════════════════════════════════════\n');
});

export default app;
