import rateLimit from 'express-rate-limit';
import logger from '../config/logger';

// Rate limiter para login (muy restrictivo)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por ventana
  message: 'Demasiados intentos de login. Intenta más tarde.',
  standardHeaders: true, // retorna info en `RateLimit-*` headers
  legacyHeaders: false, // desactiva `X-RateLimit-*` headers
  skip: (req) => process.env.NODE_ENV !== 'production',
});

// Rate limiter para OCR (moderado - caro en CPU)
export const ocrLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 análisis por hora por usuario
  message: 'Límite de análisis OCR excedido. Intenta más tarde.',
  keyGenerator: (req) => {
    // Por usuario si autenticado, si no por IP
    return req.user?.email || req.ip || 'unknown';
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production',
});

// Rate limiter general para API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por ventana
  message: 'Demasiadas solicitudes. Intenta más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // No limitar GET requests de bajo costo en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    return req.method === 'GET' && !req.path.includes('/api/ocr');
  },
});

// Rate limiter para endpoints públicos (más permisivo)
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 requests por minuto
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production',
});
