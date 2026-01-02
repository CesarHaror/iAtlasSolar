// =====================================================
// SERVICIO DE WHATSAPP
// Generación de enlaces para compartir por WhatsApp
// =====================================================

import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';

// =====================================================
// CONFIGURACIÓN
// =====================================================

const WHATSAPP_API_URL = 'https://api.whatsapp.com/send';
const WHATSAPP_WEB_URL = 'https://web.whatsapp.com/send';

// =====================================================
// INTERFACES
// =====================================================

export interface WhatsAppMessageOptions {
  quotationId: string;
  useWebVersion?: boolean;
  customMessage?: string;
}

export interface WhatsAppLinkResult {
  success: boolean;
  url: string;
  phone: string;
  message: string;
}

// =====================================================
// FORMATEO DE MENSAJE
// =====================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Genera el mensaje de WhatsApp para una cotización
 */
function generateQuotationMessage(
  quotation: any,
  customMessage?: string
): string {
  const lines = [
    `☀️ *ATLAS SOLAR*`,
    `_Energía Solar para tu Hogar y Negocio_`,
    ``,
    `─────────────────────`,
    ``,
    `¡Hola ${quotation.client.name.split(' ')[0]}! 👋`,
    ``,
    `Te comparto los detalles de tu cotización solar:`,
    ``,
    `📋 *Cotización:* ${quotation.quoteNumber}`,
    ``,
    `─────────────────────`,
    `*🔆 SISTEMA PROPUESTO*`,
    `─────────────────────`,
    ``,
    `⚡ *Potencia:* ${quotation.systemSize} kWp`,
    `📦 *Paneles:* ${quotation.panelsQty} x ${quotation.panelBrand}`,
    `🔌 *Inversor:* ${quotation.inverterBrand} ${quotation.inverterPower}kW`,
    ``,
    `─────────────────────`,
    `*💰 INVERSIÓN Y AHORRO*`,
    `─────────────────────`,
    ``,
    `💵 *Precio Total:* ${formatCurrency(quotation.salePrice)}`,
    ``,
    `✅ *Ahorro mensual:* ${formatCurrency(quotation.monthlySavings)}`,
    `✅ *Ahorro anual:* ${formatCurrency(quotation.annualSavings)}`,
    ``,
    `📈 *Retorno de inversión:* ${quotation.paybackYears} años`,
    `📊 *ROI a 25 años:* ${quotation.roi25Years}%`,
    ``,
    `─────────────────────`,
    `*✨ INCLUYE*`,
    `─────────────────────`,
    ``,
    `• Paneles solares de alta eficiencia`,
    `• Inversor con garantía`,
    `• Estructura de montaje`,
    `• Instalación profesional`,
    `• Trámite CFE incluido`,
    `• Monitoreo de producción`,
    `• Garantía 25 años paneles`,
    ``,
    `─────────────────────`,
    ``,
    `📅 *Válida hasta:* ${formatDate(quotation.validUntil)}`,
    ``,
  ];
  
  if (customMessage) {
    lines.push(`💬 *Nota:* ${customMessage}`);
    lines.push(``);
  }
  
  lines.push(`¿Te gustaría agendar una visita para revisar la instalación? 🏠`);
  lines.push(``);
  lines.push(`_Atlas Solar - Energía limpia para un futuro brillante_ 🌱`);
  
  return lines.join('\n');
}

/**
 * Genera mensaje corto para compartir
 */
function generateShortMessage(quotation: any): string {
  return [
    `☀️ *Atlas Solar* - Cotización ${quotation.quoteNumber}`,
    ``,
    `Sistema: *${quotation.systemSize} kWp*`,
    `Inversión: *${formatCurrency(quotation.salePrice)}*`,
    `Ahorro mensual: *${formatCurrency(quotation.monthlySavings)}*`,
    `Retorno: *${quotation.paybackYears} años*`,
    ``,
    `¿Te interesa? Responde este mensaje 📲`,
  ].join('\n');
}

// =====================================================
// FUNCIONES PRINCIPALES
// =====================================================

/**
 * Genera un enlace de WhatsApp para enviar la cotización
 */
export async function generateWhatsAppLink(
  options: WhatsAppMessageOptions
): Promise<WhatsAppLinkResult> {
  const { quotationId, useWebVersion = false, customMessage } = options;
  
  // Obtener cotización con cliente
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      client: true,
    },
  });
  
  if (!quotation) {
    throw new AppError(404, 'Cotización no encontrada');
  }
  
  if (!quotation.client) {
    throw new AppError(400, 'La cotización no tiene un cliente asociado');
  }
  
  if (!quotation.client.phone) {
    throw new AppError(400, 'El cliente no tiene número de teléfono registrado');
  }
  
  // Limpiar número de teléfono (solo dígitos)
  let phone = quotation.client.phone.replace(/\D/g, '');
  
  // Agregar código de país si no lo tiene
  if (phone.length === 10) {
    phone = '52' + phone; // México por defecto
  }
  
  // Generar mensaje
  const message = generateQuotationMessage(quotation, customMessage);
  
  // Construir URL
  const baseUrl = useWebVersion ? WHATSAPP_WEB_URL : WHATSAPP_API_URL;
  const encodedMessage = encodeURIComponent(message);
  const url = `${baseUrl}?phone=${phone}&text=${encodedMessage}`;
  
  return {
    success: true,
    url,
    phone,
    message,
  };
}

/**
 * Genera enlace corto de WhatsApp (mensaje resumido)
 */
export async function generateShortWhatsAppLink(
  quotationId: string
): Promise<WhatsAppLinkResult> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      client: true,
    },
  });
  
  if (!quotation) {
    throw new AppError(404, 'Cotización no encontrada');
  }
  
  if (!quotation.client?.phone) {
    throw new AppError(400, 'El cliente no tiene número de teléfono');
  }
  
  let phone = quotation.client.phone.replace(/\D/g, '');
  if (phone.length === 10) {
    phone = '52' + phone;
  }
  
  const message = generateShortMessage(quotation);
  const url = `${WHATSAPP_API_URL}?phone=${phone}&text=${encodeURIComponent(message)}`;
  
  return {
    success: true,
    url,
    phone,
    message,
  };
}

/**
 * Genera enlace de WhatsApp sin número (para copiar y pegar)
 */
export async function generateWhatsAppShareText(quotationId: string): Promise<string> {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      client: true,
    },
  });
  
  if (!quotation) {
    throw new AppError(404, 'Cotización no encontrada');
  }
  
  return generateQuotationMessage(quotation);
}
