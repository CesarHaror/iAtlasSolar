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
import logger from './config/logger.js';
import { errorHandler as customErrorHandler } from './middleware/errorHandler.js';
import { apiLimiter, loginLimiter, ocrLimiter } from './middleware/rateLimiter.js';
import { validateJSONInput } from './middleware/validation.js';

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
import aiRoutes from './modules/ai/ai.routes.js';

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

// Logging middleware
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  next();
});

// Validación de Content-Type
app.use(validateJSONInput);

// Rate limiting general
app.use(apiLimiter);

// Rate limiting específico para auth (más estricto)
app.use('/api/auth/login', loginLimiter);

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
app.use('/api/auth/login', loginLimiter);
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

// OCR - Análisis de recibos CFE (con rate limiting específico)
app.use('/api/ocr', ocrLimiter, ocrRoutes);

// IA AVANZADA - FASE 4
app.use('/api/ai', aiRoutes);

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// Ruta no encontrada
app.use(notFoundHandler);

// Manejador global de errores mejorado
app.use(customErrorHandler);

// Fallback para errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error({
    message: 'Unhandled Rejection',
    reason,
    promise,
  });
});

process.on('uncaughtException', (error) => {
  logger.error({
    message: 'Uncaught Exception',
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================

const PORT = config.port;

// Inicializar servicios IA antes de escuchar
(async () => {
  try {
    // Inicializar Tesseract OCR (opcional, mejora OCR pero puede ser lento)
    const advancedOCRModule = (await import('./modules/ai/ocr-advanced.service.js')).default;
    if (advancedOCRModule && typeof (advancedOCRModule as any).initialize === 'function') {
      await (advancedOCRModule as any).initialize();
      logger.info({ message: 'Advanced OCR service initialized' });
    }
  } catch (error) {
    logger.warn({
      message: 'Could not initialize Advanced OCR, will use fallback',
      error: error instanceof Error ? error.message : 'Unknown'
    });
  }

  app.listen(PORT, () => {
    console.log('\n🚀 ═══════════════════════════════════════════════════════');
    console.log('   iATLAS SOLAR - API Server - FASE 4 (IA AVANZADA)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`   🌐 URL:         http://localhost:${PORT}`);
    console.log(`   📡 Ambiente:    ${config.nodeEnv}`);
    console.log(`   🔗 Frontend:    ${config.frontendUrl}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   📚 ENDPOINTS DE IA DISPONIBLES:');
    console.log(`      POST /api/ai/ocr/analyze-advanced         - OCR con Tesseract`);
    console.log(`      POST /api/ai/consumption/analyze          - Análisis de consumo`);
    console.log(`      POST /api/ai/quotations/generate-from-ocr - Auto-generar cotización`);
    console.log(`      POST /api/ai/emails/generate-proposal     - Generar email propuesta`);
    console.log(`      POST /api/ai/emails/generate-analysis     - Generar email análisis`);
    console.log(`      GET  /api/ai/health                       - Estado de servicios IA`);
    console.log('═══════════════════════════════════════════════════════════\n');
  });
})();

export default app;
