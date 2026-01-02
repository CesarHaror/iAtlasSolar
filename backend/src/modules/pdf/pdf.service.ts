// =====================================================
// SERVICIO DE GENERACIÓN DE PDF
// Genera cotizaciones en formato PDF profesional
// =====================================================

import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { prisma } from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import * as configService from '../config/config.service.js';

// =====================================================
// HELPERS DE HANDLEBARS
// =====================================================

// Formatear moneda
Handlebars.registerHelper('formatCurrency', (value: number) => {
  if (value === null || value === undefined) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
});

// Formatear número
Handlebars.registerHelper('formatNumber', (value: number) => {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('es-MX').format(value);
});

// Formatear fecha
Handlebars.registerHelper('formatDate', (date: Date | string) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
});

// Formatear porcentaje
Handlebars.registerHelper('formatPercent', (value: number) => {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(0)}%`;
});

// Convertir años a meses
Handlebars.registerHelper('yearsToMonths', (value: number) => {
  if (value === null || value === undefined) return '0';
  return Math.round(value * 12).toString();
});

// =====================================================
// PLANTILLA HTML DEL PDF
// =====================================================

const PDF_TEMPLATE = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotización {{quoteNumber}}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #1f2937;
      background: white;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm 15mm 2mm 15mm;
      background: white;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 3px solid #F3973E;
      margin-bottom: 25px;
    }
    
    .logo-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .logo {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #F3973E, #ea580c);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .logo svg {
      width: 36px;
      height: 36px;
      fill: white;
    }
    
    .company-name {
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
    }
    
    .company-tagline {
      font-size: 11px;
      color: #6b7280;
      margin-top: 2px;
    }
    
    .quote-info {
      text-align: right;
    }
    
    .quote-number {
      font-size: 18px;
      font-weight: 700;
      color: #F3973E;
    }
    
    .quote-date {
      color: #6b7280;
      margin-top: 5px;
    }
    
    .quote-valid {
      font-size: 11px;
      color: #6b7280;
      margin-top: 3px;
    }
    
    /* Client Section */
    .client-section {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 25px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .section-title::before {
      content: '';
      width: 4px;
      height: 18px;
      background: #F3973E;
      border-radius: 2px;
    }
    
    .client-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    
    .client-name {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      grid-column: span 2;
    }
    
    .client-detail {
      color: #6b7280;
    }
    
    /* System Summary */
    .system-summary {
      background: linear-gradient(135deg, #F3973E, #ea580c);
      border-radius: 12px;
      padding: 25px;
      color: white;
      margin-bottom: 25px;
    }
    
    .system-title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .system-subtitle {
      opacity: 0.9;
      margin-bottom: 20px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
    }
    
    .stat-card {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 20px;
      font-weight: 700;
    }
    
    .stat-label {
      font-size: 10px;
      opacity: 0.9;
      margin-top: 3px;
    }
    
    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
    }
    
    .content-card {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
    }
    
    /* Equipment List */
    .equipment-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .equipment-item:last-child {
      border-bottom: none;
    }
    
    .equipment-name {
      font-weight: 500;
    }
    
    .equipment-detail {
      color: #6b7280;
      font-size: 11px;
    }
    
    .equipment-qty {
      text-align: right;
      color: #6b7280;
    }
    
    /* Savings Comparison */
    .savings-comparison {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-top: 15px;
    }
    
    .bill-card {
      flex: 1;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    
    .bill-before {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }
    
    .bill-after {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }
    
    .bill-label {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 5px;
    }
    
    .bill-value {
      font-size: 18px;
      font-weight: 700;
    }
    
    .bill-before .bill-value {
      color: #dc2626;
    }
    
    .bill-after .bill-value {
      color: #16a34a;
    }
    
    .arrow {
      font-size: 20px;
      color: #F3973E;
    }
    
    /* Investment Table */
    .investment-table {
      width: 100%;
      margin-top: 15px;
    }
    
    .investment-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .investment-row:last-child {
      border-bottom: none;
    }
    
    .investment-label {
      color: #6b7280;
    }
    
    .investment-value {
      font-weight: 500;
    }
    
    .total-row {
      background: #F3973E;
      color: white;
      margin: 15px -20px -20px;
      padding: 15px 20px;
      border-radius: 0 0 12px 12px;
      display: flex;
      justify-content: space-between;
      font-size: 16px;
      font-weight: 700;
    }
    
    /* Environmental Impact */
    .env-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 15px;
    }
    
    .env-card {
      background: #ecfdf5;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    
    .env-value {
      font-size: 24px;
      font-weight: 700;
      color: #16a34a;
    }
    
    .env-label {
      font-size: 11px;
      color: #6b7280;
      margin-top: 5px;
    }
    
    /* ROI Section */
    .roi-section {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 25px;
    }
    
    .roi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 15px;
    }
    
    .roi-item {
      text-align: center;
    }
    
    .roi-value {
      font-size: 28px;
      font-weight: 700;
      color: #F3973E;
    }
    
    .roi-label {
      font-size: 11px;
      color: #6b7280;
      margin-top: 5px;
    }
    
    /* Notes Section */
    .notes-section {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 25px;
    }
    
    .notes-text {
      color: #6b7280;
      font-style: italic;
    }
    
    /* Footer */
    .footer {
      border-top: 2px solid #e5e7eb;
      padding-top: 20px;
      margin-top: 30px;
    }
    
    .footer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      text-align: center;
    }
    
    .footer-item {
      color: #6b7280;
    }
    
    .footer-label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 5px;
    }
    
    .terms {
      margin-top: 25px;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
      font-size: 10px;
      color: #9ca3af;
    }
    
    .terms-title {
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .terms-list {
      list-style: disc;
      padding-left: 20px;
    }
    
    .terms-list li {
      margin-bottom: 3px;
    }
    
    /* Signature Area */
    .signature-area {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
    }
    
    .signature-box {
      text-align: center;
    }
    
    .signature-line {
      border-top: 1px solid #374151;
      margin-top: 50px;
      padding-top: 10px;
      font-size: 11px;
      color: #6b7280;
    }
    
    /* Page Break */
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  <!-- Segunda página: Cotización -->
  <div class="page">
    <div class="header">
      <div class="logo-section">
        {{#if company.logo}}
        <img src="{{company.logo}}" alt="Logo" style="width: 60px; height: 60px; object-fit: contain; border-radius: 12px;" />
        {{else}}
        <div class="logo">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        {{/if}}
        <div>
          <div class="company-name">{{company.name}}</div>
          <div class="company-tagline">Energía Solar para tu Hogar y Negocio</div>
        </div>
      </div>
      <div class="quote-info">
        <div class="quote-number">{{quoteNumber}}</div>
        <div class="quote-date">{{formatDate createdAt}}</div>
        <div class="quote-valid">Válida hasta: {{formatDate validUntil}}</div>
      </div>
    </div>
    
    <!-- Client Section -->
    <div class="client-section">
      <div class="section-title">Datos del Cliente</div>
      <div style="display: flex; justify-content: space-between;">
        <div style="flex: 1;">
          <div class="client-name">{{client.name}}</div>
          {{#if client.address}}
          <div class="client-detail" style="margin-top: 5px;">📍 {{client.address}}{{#if client.city}}, {{client.city}}{{/if}}</div>
          {{/if}}
        </div>
        <div style="flex: 1; text-align: right;">
          {{#if client.cfeServiceNumber}}
          <div class="client-detail">🔢 Servicio: {{client.cfeServiceNumber}}</div>
          {{/if}}
          <div class="client-detail">📧 {{client.email}}</div>
          <div class="client-detail">📱 {{client.phone}}</div>
        </div>
      </div>
    </div>
    
    <!-- System Summary -->
    <div class="system-summary">
      <div class="system-title">Sistema Solar de {{systemSize}} kWp</div>
      <div class="system-subtitle">{{panelsQty}} paneles {{panelBrand}} • Inversor {{inverterBrand}} {{inverterPower}}kW</div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{formatNumber monthlyProduction}}</div>
          <div class="stat-label">kWh/mes generados</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{formatCurrency actualMonthlySavings}}</div>
          <div class="stat-label">Ahorro mensual</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{yearsToMonths paybackYears}} meses</div>
          <div class="stat-label">Retorno inversión</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{formatPercent coveragePercent}}</div>
          <div class="stat-label">Cobertura consumo</div>
        </div>
      </div>
    </div>
    
    <!-- Content Grid -->
    <div class="content-grid">
      <!-- Equipment -->
      <div class="content-card">
        <div class="section-title">Equipos del Sistema</div>
        <div class="equipment-item">
          <div>
            <div class="equipment-name">Panel Solar {{panelBrand}}</div>
            <div class="equipment-detail">{{panelModel}} - {{panelPower}}W</div>
          </div>
          <div class="equipment-qty">×{{panelsQty}}</div>
        </div>
        <div class="equipment-item">
          <div>
            <div class="equipment-name">Inversor {{inverterBrand}}</div>
            <div class="equipment-detail">{{inverterModel}} - {{inverterPower}}kW</div>
          </div>
          <div class="equipment-qty">×1</div>
        </div>
        <div class="equipment-item">
          <div>
            <div class="equipment-name">Estructura de montaje</div>
            <div class="equipment-detail">Aluminio anodizado, para {{structureType}}</div>
          </div>
          <div class="equipment-qty">1 set</div>
        </div>
        <div class="equipment-item">
          <div>
            <div class="equipment-name">Material eléctrico</div>
            <div class="equipment-detail">Cableado, protecciones, conectores</div>
          </div>
          <div class="equipment-qty">1 kit</div>
        </div>
      </div>
      
      <!-- Savings -->
      <div class="content-card">
        <div class="section-title">Tu Ahorro Mensual</div>
        <div class="savings-comparison">
          <div class="bill-card bill-before">
            <div class="bill-label">Recibo Actual</div>
            <div class="bill-value">{{formatCurrency avgBill}}</div>
          </div>
          <div class="arrow">→</div>
          <div class="bill-card bill-after">
            <div class="bill-label">Con Energía Solar</div>
            <div class="bill-value">{{formatCurrency newBill}}</div>
          </div>
        </div>
        <div style="margin-top: 20px; text-align: center; padding: 15px; background: #f0fdf4; border-radius: 8px;">
          <div style="font-size: 11px; color: #6b7280;">Ahorras cada mes</div>
          <div style="font-size: 24px; font-weight: 700; color: #16a34a;">{{formatCurrency actualMonthlySavings}}</div>
        </div>
      </div>
    </div>
    
    <!-- Investment and Environmental -->
      <!-- Page Break for Investment and Environmental -->
      <div class="page-break"></div>
      <div style="margin-top:40px;"></div>
      <div class="content-grid">
        <!-- Investment -->
        <div class="content-card">
          <div class="section-title">Tu Inversión</div>
          <div class="investment-table">
            <div class="investment-row">
              <span class="investment-label">Panel Solar Unitario</span>
              <span class="investment-value">$8,500.00</span>
            </div>
            <div class="investment-row">
              <span class="investment-label">Inversor</span>
            </div>
            <div class="investment-row">
              <span class="investment-label">Estructura</span>
            </div>
            <div class="investment-row">
              <span class="investment-label">Instalación</span>
            </div>
            {{#if discount}}
            <div class="investment-row" style="color: #16a34a;">
              <span class="investment-label">Descuento</span>
              <span class="investment-value">-{{formatCurrency discount}}</span>
            </div>
            {{/if}}
          </div>
          <div class="total-row">
            <span>TOTAL</span>
            <span>{{formatCurrency salePrice}}</span>
          </div>
        </div>
      
        <!-- Environmental Impact -->
        <div class="content-card">
          <div class="section-title">Impacto Ambiental</div>
          <p style="color: #6b7280; margin-bottom: 15px;">Con tu sistema solar contribuyes al medio ambiente cada año:</p>
          <div class="env-grid">
            <div class="env-card">
              <div class="env-value">{{co2Tons}}</div>
              <div class="env-label">Toneladas de CO₂ evitadas/año</div>
            </div>
            <div class="env-card">
              <div class="env-value">{{treesEquivalent}}</div>
              <div class="env-label">Árboles equivalentes</div>
            </div>
          </div>
          <div style="margin-top: 20px; text-align: center; padding: 15px; background: #f9fafb; border-radius: 8px;">
            <div style="font-size: 11px; color: #6b7280;">Generación anual</div>
            <div style="font-size: 20px; font-weight: 700; color: #F3973E;">{{formatNumber annualProduction}} kWh</div>
          </div>
        </div>
      </div>
    
    <!-- ROI Section -->
    <div class="roi-section">
      <div class="section-title">Retorno de Inversión</div>
      <div class="roi-grid">
        <div class="roi-item">
          <div class="roi-value">{{yearsToMonths paybackYears}}</div>
          <div class="roi-label">Meses para recuperar inversión</div>
        </div>
        <div class="roi-item">
          <div class="roi-value">{{formatPercent roi25Years}}</div>
          <div class="roi-label">ROI a 25 años</div>
        </div>
        <div class="roi-item">
          <div class="roi-value">{{formatCurrency lifetimeSavings}}</div>
          <div class="roi-label">Ahorro total en 25 años</div>
        </div>
      </div>
    </div>
    
    {{#if clientNotes}}
    <!-- Notes -->
    <div class="notes-section">
      <div class="section-title">Notas</div>
      <p class="notes-text">{{clientNotes}}</p>
    </div>
    {{/if}}
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-grid">
        <div class="footer-item">
          <div class="footer-label">Garantías</div>
          <div>Paneles: 25 años</div>
          <div>Inversor: 10 años</div>
          <div>Instalación: 5 años</div>
        </div>
        <div class="footer-item">
          <div class="footer-label">Incluye</div>
          <div>Trámite CFE</div>
          <div>Instalación completa</div>
          <div>Monitoreo remoto</div>
        </div>
        <div class="footer-item">
          <div class="footer-label">Contacto</div>
          <div>{{company.phone}}</div>
          <div>{{company.email}}</div>
          {{#if company.address}}<div>{{company.address}}</div>{{/if}}
        </div>
      </div>
      
      <div class="terms">
        <div class="terms-title">Términos y Condiciones</div>
        <ul class="terms-list">
          <li>Precio válido sujeto a disponibilidad de equipos.</li>
          <li>Tiempo de instalación: 5-10 días hábiles después de anticipo.</li>
          <li>Forma de pago: 50% anticipo, 50% contra entrega.</li>
          <li>El cliente debe contar con servicio eléctrico activo y contrato bidireccional o interconexión.</li>
          <li>La producción estimada puede variar ±10% según condiciones climáticas.</li>
        </ul>
      </div>
      
      <div class="signature-area">
        <div class="signature-box">
          <div class="signature-line">Firma del Cliente</div>
        </div>
        <div class="signature-box">
          <div class="signature-line">Representante {{company.name}}</div>
        </div>
      </div>

      <!-- Disclaimer -->
      <div style="margin-top: 40px; padding: 15px; background-color: #f3f4f6; border-left: 4px solid #f3973e; border-radius: 4px; font-size: 10px; color: #4b5563; line-height: 1.6;">
        <strong style="color: #1f2937;">Aclaración Importante:</strong> Los cálculos y estimaciones presentados en esta cotización se basan en los datos proporcionados y son aproximados. El rendimiento real del sistema, ahorro mensual, período de recuperación de inversión y retorno sobre inversión pueden variar significativamente debido a factores como: variaciones en el consumo de energía, cambios en las tarifas de electricidad, condiciones climáticas locales, sombreamiento, orientación del techo, mantenimiento del sistema y cambios en los patrones de consumo del usuario. Se recomienda actualizar los cálculos periódicamente para mantener una proyección precisa.
      </div>
    </div>
  </div>
</body>
</html>
`;

// =====================================================
// FUNCIÓN PRINCIPAL DE GENERACIÓN
// =====================================================

export interface PDFGenerationResult {
  buffer: Buffer;
  filename: string;
}

export async function generateQuotationPDF(quotationId: string): Promise<PDFGenerationResult> {
  // Obtener configuración de la empresa
  const companyConfigs = await configService.getConfigs([
    'company.name',
    'company.phone',
    'company.email',
    'company.address',
    'company.logo',
  ]);
  
  // Convertir logo a base64 si existe
  let logoBase64 = '';
  const logoPath = companyConfigs['company.logo'];
  if (logoPath) {
    // La ruta es como /uploads/images/image-xxx.png
    const fullPath = path.join(process.cwd(), logoPath.replace(/^\//, ''));
    if (existsSync(fullPath)) {
      try {
        const imageBuffer = readFileSync(fullPath);
        const ext = path.extname(fullPath).toLowerCase().replace('.', '');
        const mimeType = ext === 'svg' ? 'image/svg+xml' : 
                         ext === 'png' ? 'image/png' : 
                         ext === 'gif' ? 'image/gif' : 
                         ext === 'webp' ? 'image/webp' : 'image/jpeg';
        logoBase64 = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
      } catch (e) {
        console.error('Error leyendo logo:', e);
      }
    }
  }
  
  // Obtener cotización con todos los datos
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      client: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });
  
  if (!quotation) {
    throw new AppError(404, 'Cotización no encontrada');
  }
  
  // Preparar datos para la plantilla
  const costBreakdown = quotation.costBreakdown as any || {};
  
  const templateData = {
    ...quotation,
    company: {
      name: companyConfigs['company.name'] || 'Atlas Solar',
      phone: companyConfigs['company.phone'] || '',
      email: companyConfigs['company.email'] || '',
      address: companyConfigs['company.address'] || '',
      logo: logoBase64, // Usar base64 en lugar de URL
    },
    newBill: quotation.monthlyBillAfter || (quotation.avgBill - quotation.monthlySavings),
    actualMonthlySavings: quotation.avgBill - (quotation.monthlyBillAfter || (quotation.avgBill - quotation.monthlySavings)),
    costs: {
      panels: costBreakdown.panels || 0,
      inverter: costBreakdown.inverter || 0,
      structure: costBreakdown.structure || 0,
      installation: costBreakdown.installation || 0,
      electrical: costBreakdown.electrical || 0,
      labor: costBreakdown.labor || 0,
      iva: costBreakdown.iva || 0,
    },
    co2Tons: ((quotation.annualProduction || 0) * 0.527 / 1000).toFixed(1),
    treesEquivalent: Math.round((quotation.annualProduction || 0) * 0.527 / 22),
    lifetimeSavings: (quotation.annualSavings || 0) * 22, // Aprox 25 años con degradación
    structureType: quotation.structureType || 'Techo',
    presentacionBase64: getPresentacionBase64(),
  };
  
  // Compilar plantilla
  const template = Handlebars.compile(PDF_TEMPLATE);
  const html = template(templateData);
  
  // Generar PDF con Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
    });
    
    const filename = `cotizacion-${quotation.quoteNumber.replace(/\//g, '-')}.pdf`;
    
    return {
      buffer: Buffer.from(pdfBuffer),
      filename,
    };
  } finally {
    await browser.close();
  }
}

// =====================================================
// GUARDAR PDF EN DISCO (Opcional)
// =====================================================

export async function savePDFToDisk(quotationId: string): Promise<string> {
  const { buffer, filename } = await generateQuotationPDF(quotationId);
  
  // Crear directorio si no existe
  const pdfDir = path.join(process.cwd(), 'pdfs');
  await fs.mkdir(pdfDir, { recursive: true });
  
  // Guardar archivo
  const filePath = path.join(pdfDir, filename);
  await fs.writeFile(filePath, buffer);
  
  // Actualizar URL en la cotización
  await prisma.quotation.update({
    where: { id: quotationId },
    data: { pdfUrl: `/pdfs/${filename}` },
  });
  
  return `/pdfs/${filename}`;
}

// Utilidad para obtener la imagen de portada en base64
function getPresentacionBase64() {
  try {
    const imgPath = path.join(process.cwd(), 'backend/static/presentacionPDF-small.png');
    const img = readFileSync(imgPath);
    return `data:image/png;base64,${img.toString('base64')}`;
  } catch (e) {
    return '';
  }
}
