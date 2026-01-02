// =====================================================
// RUTAS DE NOTIFICACIONES
// Email y WhatsApp endpoints
// =====================================================

import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import {
  sendQuotationEmailController,
  getWhatsAppLinkController,
  getShortWhatsAppLinkController,
  getWhatsAppTextController,
  testEmailConfigController,
} from './notifications.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// =====================================================
// RUTAS DE EMAIL
// =====================================================

// Enviar cotización por email
router.post('/quotations/:id/send-email', sendQuotationEmailController);

// Probar configuración SMTP
router.post('/notifications/test-email', testEmailConfigController);

// =====================================================
// RUTAS DE WHATSAPP
// =====================================================

// Obtener enlace de WhatsApp (mensaje completo)
router.get('/quotations/:id/whatsapp', getWhatsAppLinkController);

// Obtener enlace de WhatsApp (mensaje corto)
router.get('/quotations/:id/whatsapp/short', getShortWhatsAppLinkController);

// Obtener texto para copiar y compartir
router.get('/quotations/:id/whatsapp/text', getWhatsAppTextController);

export { router as notificationRoutes };
