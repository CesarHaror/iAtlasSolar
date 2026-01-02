// Enviar correo de prueba
export async function sendTestEmail(to: string) {
  const transporter = await createTransporter();
  const emailCfg = await getEmailConfigFromDB();
  await transporter.sendMail({
    from: emailCfg.from,
    to,
    subject: 'Prueba de configuración SMTP - iAtlas Solar',
    text: '¡La configuración SMTP fue exitosa! Este es un correo de prueba enviado desde iAtlas Solar.',
    html: `<p>¡La configuración SMTP fue exitosa! Este es un correo de prueba enviado desde <b>iAtlas Solar</b>.</p>`
  });
}
// =====================================================
// SERVICIO DE EMAIL
// Envío de correos electrónicos con Nodemailer
// =====================================================

import nodemailer from 'nodemailer';
import { config } from '../../config';
import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { generateQuotationPDF } from '../pdf/pdf.service';

// =====================================================
// CONFIGURACIÓN DEL TRANSPORTER
// =====================================================

// Crear transporter de Nodemailer
async function getEmailConfigFromDB() {
  const systemConfigs = await prisma.systemConfig.findMany({
    where: { key: { in: [
      'notifications.emailHost',
      'notifications.emailPort',
      'notifications.emailSecure',
      'notifications.emailUser',
      'notifications.emailPass',
      'notifications.emailFrom',
    ] } },
  });
  const map: Record<string, string> = {};
  for (const c of systemConfigs) map[c.key] = c.value;
  return {
    host: map['notifications.emailHost'] || config.email.host,
    port: map['notifications.emailPort'] ? parseInt(map['notifications.emailPort']) : config.email.port,
    secure: map['notifications.emailSecure'] === 'true',
    user: map['notifications.emailUser'] || config.email.user,
    pass: map['notifications.emailPass'] || config.email.pass,
    from: map['notifications.emailFrom'] || config.email.from,
  };
}

const createTransporter = async () => {
  // Para desarrollo: usar Ethereal (emails de prueba)
  if (config.nodeEnv === 'development' && !config.email?.host) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass',
      },
    });
  }
  // Para producción: usar configuración SMTP real (de BD si existe)
  const emailCfg = await getEmailConfigFromDB();
  return nodemailer.createTransport({
    host: emailCfg.host,
    port: emailCfg.port,
    secure: emailCfg.secure,
    auth: {
      user: emailCfg.user,
      pass: emailCfg.pass,
    },
  });
};

// =====================================================
// PLANTILLAS DE EMAIL
// =====================================================

const emailStyles = `
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #374151;
    margin: 0;
    padding: 0;
    background-color: #f3f4f6;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .header {
    background: linear-gradient(135deg, #f97316, #ea580c);
    color: white;
    padding: 30px;
    text-align: center;
  }
  .logo {
    font-size: 28px;
    font-weight: bold;
    margin-bottom: 5px;
  }
  .tagline {
    font-size: 14px;
    opacity: 0.9;
  }
  .content {
    padding: 30px;
  }
  .highlight-box {
    background: linear-gradient(135deg, #f97316, #ea580c);
    color: white;
    border-radius: 12px;
    padding: 25px;
    text-align: center;
    margin: 20px 0;
  }
  .highlight-value {
    font-size: 32px;
    font-weight: bold;
  }
  .highlight-label {
    font-size: 14px;
    opacity: 0.9;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin: 20px 0;
  }
  .info-card {
    background: #f9fafb;
    border-radius: 8px;
    padding: 15px;
    text-align: center;
  }
  .info-value {
    font-size: 20px;
    font-weight: bold;
    color: #f97316;
  }
  .info-label {
    font-size: 12px;
    color: #6b7280;
    margin-top: 5px;
  }
  .button {
    display: inline-block;
    background: #f97316;
    color: white;
    padding: 14px 28px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: bold;
    margin: 20px 0;
  }
  .button:hover {
    background: #ea580c;
  }
  .footer {
    background: #f9fafb;
    padding: 20px 30px;
    text-align: center;
    font-size: 12px;
    color: #6b7280;
  }
  .footer a {
    color: #f97316;
    text-decoration: none;
  }
  .divider {
    border-top: 1px solid #e5e7eb;
    margin: 20px 0;
  }
  .note {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    padding: 15px;
    margin: 20px 0;
    font-size: 14px;
  }
`;

// Plantilla para cotización
const quotationEmailTemplate = (data: {
  clientName: string;
  quoteNumber: string;
  systemSize: number;
  salePrice: number;
  monthlySavings: number;
  paybackYears: number;
  roi25Years: number;
  validUntil: Date;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  customMessage?: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">☀️ Atlas Solar</div>
      <div class="tagline">Energía Solar para tu Hogar y Negocio</div>
    </div>
    
    <div class="content">
      <h2 style="margin-top: 0;">¡Hola ${data.clientName}!</h2>
      
      <p>Te enviamos tu cotización personalizada de sistema de energía solar.</p>
      
      ${data.customMessage ? `
      <div class="note">
        <strong>Mensaje de tu asesor:</strong><br>
        ${data.customMessage}
      </div>
      ` : ''}
      
      <div class="highlight-box">
        <div class="highlight-label">Cotización ${data.quoteNumber}</div>
        <div class="highlight-value">Sistema de ${data.systemSize} kWp</div>
        <div class="highlight-label">Inversión: $${data.salePrice.toLocaleString('es-MX')} MXN</div>
      </div>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
        <tr>
          <td width="48%" style="background: #f9fafb; border-radius: 8px; padding: 15px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #16a34a;">$${data.monthlySavings.toLocaleString('es-MX')}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Ahorro mensual</div>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background: #f9fafb; border-radius: 8px; padding: 15px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #f97316;">${data.paybackYears} años</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">Retorno de inversión</div>
          </td>
        </tr>
      </table>
      
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
        <tr>
          <td width="48%" style="background: #ecfdf5; border-radius: 8px; padding: 15px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${data.roi25Years}%</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">ROI a 25 años</div>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background: #fffbeb; border-radius: 8px; padding: 15px; text-align: center;">
            <div style="font-size: 14px; font-weight: bold; color: #d97706;">Válida hasta</div>
            <div style="font-size: 16px; color: #6b7280; margin-top: 5px;">${new Date(data.validUntil).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </td>
        </tr>
      </table>
      
      <div class="divider"></div>
      
      <h3>¿Qué incluye tu sistema?</h3>
      <ul>
        <li>✅ Paneles solares de alta eficiencia</li>
        <li>✅ Inversor con garantía extendida</li>
        <li>✅ Estructura de montaje</li>
        <li>✅ Instalación profesional</li>
        <li>✅ Trámite de interconexión CFE</li>
        <li>✅ Monitoreo remoto de producción</li>
        <li>✅ Garantía de 25 años en paneles</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="mailto:${data.senderEmail}?subject=Re: Cotización ${data.quoteNumber}" class="button" style="color: white;">
          Responder a esta cotización
        </a>
      </div>
      
      <div class="divider"></div>
      
      <p><strong>Tu asesor solar:</strong></p>
      <p>
        ${data.senderName}<br>
        📧 ${data.senderEmail}<br>
        ${data.senderPhone ? `📱 ${data.senderPhone}` : ''}
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Atlas Solar</strong></p>
      <p>Energía limpia para un futuro brillante</p>
      <p style="margin-top: 15px; font-size: 11px; color: #9ca3af;">
        Este correo fue enviado porque recibiste una cotización de Atlas Solar.<br>
        Si no esperabas este mensaje, puedes ignorarlo.
      </p>
    </div>
  </div>
</body>
</html>
`;

// =====================================================
// FUNCIONES DE ENVÍO
// =====================================================

export interface SendQuotationEmailOptions {
  quotationId: string;
  recipientEmail?: string; // Opcional, por defecto usa el email del cliente
  customMessage?: string;
  attachPDF?: boolean;
  senderId: string; // ID del usuario que envía
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string; // Solo para Ethereal en desarrollo
  error?: string;
}

/**
 * Enviar cotización por email
 */
export async function sendQuotationEmail(options: SendQuotationEmailOptions): Promise<EmailResult> {
  const { quotationId, recipientEmail, customMessage, attachPDF = true, senderId } = options;
  
  // Obtener cotización con cliente y creador
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      client: true,
      createdBy: true,
    },
  });
  
  if (!quotation) {
    throw new AppError(404, 'Cotización no encontrada');
  }
  
  if (!quotation.client) {
    throw new AppError(400, 'La cotización no tiene un cliente asociado');
  }
  
  // Obtener el usuario que envía
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
  });
  
  if (!sender) {
    throw new AppError(404, 'Usuario no encontrado');
  }
  
  const toEmail = recipientEmail || quotation.client.email;
  
  try {
    const transporter = await createTransporter();
    
    // Generar contenido del email
    const htmlContent = quotationEmailTemplate({
      clientName: quotation.client.name.split(' ')[0], // Solo primer nombre
      quoteNumber: quotation.quoteNumber,
      systemSize: quotation.systemSize,
      salePrice: quotation.salePrice,
      monthlySavings: quotation.monthlySavings,
      paybackYears: quotation.paybackYears ?? 0,
      roi25Years: quotation.roi25Years ?? 0,
      validUntil: quotation.validUntil ?? new Date(),
      senderName: sender.name,
      senderEmail: sender.email,
      senderPhone: sender.phone || undefined,
      customMessage,
    });
    
    // Preparar attachments
    const attachments: any[] = [];
    
    if (attachPDF) {
      try {
        const { buffer, filename } = await generateQuotationPDF(quotationId);
        attachments.push({
          filename,
          content: buffer,
          contentType: 'application/pdf',
        });
      } catch (pdfError) {
        console.error('Error generando PDF para adjuntar:', pdfError);
        // Continuar sin PDF
      }
    }
    
    // Enviar email
    const info = await transporter.sendMail({
      from: `"Atlas Solar - ${sender.name}" <${config.email?.from || 'cotizaciones@atlassolar.mx'}>`,
      to: toEmail,
      subject: `Cotización Solar ${quotation.quoteNumber} - Sistema de ${quotation.systemSize} kWp`,
      html: htmlContent,
      attachments,
    });
    
    // Actualizar estado de la cotización a SENT si estaba en DRAFT
    if (quotation.status === 'DRAFT') {
      await prisma.quotation.update({
        where: { id: quotationId },
        data: { status: 'SENT' },
      });
    }
    
    // Log del envío
    console.log('📧 Email enviado:', info.messageId);
    
    // Para Ethereal, obtener URL de preview
    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    if (previewUrl) {
      console.log('📧 Preview URL:', previewUrl);
    }
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (error: any) {
    console.error('Error enviando email:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al enviar email',
    };
  }
}

/**
 * Crear cuenta de prueba Ethereal (para desarrollo)
 */
export async function createTestEmailAccount(): Promise<{ user: string; pass: string; host: string }> {
  const testAccount = await nodemailer.createTestAccount();
  return {
    user: testAccount.user,
    pass: testAccount.pass,
    host: testAccount.smtp.host,
  };
}
