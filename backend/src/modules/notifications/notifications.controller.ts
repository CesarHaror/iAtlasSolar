/**
 * Probar configuración de email SMTP
 * POST /api/notifications/test-email
 */
export async function testEmailConfigController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { to } = req.body;
    if (!to) {
      throw new AppError(400, 'Destinatario requerido');
    }
    // Usar el servicio de email para enviar un correo de prueba
    const { sendTestEmail } = await import('./email.service');
    await sendTestEmail(to);
    res.json({ success: true, message: 'Correo de prueba enviado correctamente.' });
  } catch (error) {
    next(error);
  }
}
// =====================================================
// CONTROLADOR DE NOTIFICACIONES
// Email y WhatsApp
// =====================================================

import { Request, Response, NextFunction } from 'express';
import { sendQuotationEmail } from './email.service';
import { generateWhatsAppLink, generateShortWhatsAppLink, generateWhatsAppShareText } from './whatsapp.service';
import { AppError } from '../../shared/errors/AppError';
import { z } from 'zod';

// =====================================================
// SCHEMAS DE VALIDACIÓN
// =====================================================

const sendEmailSchema = z.object({
  recipientEmail: z.string().email().optional(),
  customMessage: z.string().max(500).optional(),
  attachPDF: z.boolean().optional().default(true),
});

const whatsappSchema = z.object({
  customMessage: z.string().max(500).optional(),
  useWebVersion: z.union([
    z.boolean(),
    z.string().transform(val => val === 'true')
  ]).optional().default(false),
});

// =====================================================
// CONTROLADORES DE EMAIL
// =====================================================

/**
 * Enviar cotización por email
 * POST /api/quotations/:id/send-email
 */
export async function sendQuotationEmailController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    if (!id) {
      throw new AppError(400, 'ID de cotización requerido');
    }
    
    if (!userId) {
      throw new AppError(401, 'Usuario no autenticado');
    }
    
    // Validar body
    const validatedData = sendEmailSchema.parse(req.body);
    
    // Enviar email
    const result = await sendQuotationEmail({
      quotationId: id,
      recipientEmail: validatedData.recipientEmail,
      customMessage: validatedData.customMessage,
      attachPDF: validatedData.attachPDF,
      senderId: userId,
    });
    
    if (!result.success) {
      throw new AppError(500, result.error || 'Error al enviar email');
    }
    
    res.status(200).json({
      success: true,
      message: 'Email enviado exitosamente',
      data: {
        messageId: result.messageId,
        previewUrl: result.previewUrl, // Solo en desarrollo con Ethereal
      },
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================
// CONTROLADORES DE WHATSAPP
// =====================================================

/**
 * Obtener enlace de WhatsApp para cotización
 * GET /api/quotations/:id/whatsapp
 */
export async function getWhatsAppLinkController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { customMessage, useWebVersion } = whatsappSchema.parse(req.query);
    
    if (!id) {
      throw new AppError(400, 'ID de cotización requerido');
    }
    
    const result = await generateWhatsAppLink({
      quotationId: id,
      customMessage: customMessage as string | undefined,
      useWebVersion: Boolean(useWebVersion),
    });
    
    res.status(200).json({
      success: true,
      data: {
        url: result.url,
        phone: result.phone,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener enlace corto de WhatsApp
 * GET /api/quotations/:id/whatsapp/short
 */
export async function getShortWhatsAppLinkController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    
    if (!id) {
      throw new AppError(400, 'ID de cotización requerido');
    }
    
    const result = await generateShortWhatsAppLink(id);
    
    res.status(200).json({
      success: true,
      data: {
        url: result.url,
        phone: result.phone,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener texto para compartir por WhatsApp
 * GET /api/quotations/:id/whatsapp/text
 */
export async function getWhatsAppTextController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    
    if (!id) {
      throw new AppError(400, 'ID de cotización requerido');
    }
    
    const text = await generateWhatsAppShareText(id);
    
    res.status(200).json({
      success: true,
      data: { text },
    });
  } catch (error) {
    next(error);
  }
}
