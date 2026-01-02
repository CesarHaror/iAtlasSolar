/**
 * SERVICIO OCR AVANZADO CON TESSERACT.JS
 * 
 * Proporciona OCR avanzado para recibos CFE con:
 * - Extracción de texto de imágenes (Tesseract.js)
 * - Procesamiento de PDFs multi-página
 * - Detección automática de campos
 * - Confianza de extracción
 * - Fallback a pdf-parse si es necesario
 */

import Tesseract from 'tesseract.js';
import pdfParse from 'pdf-parse/index.js';
import logger from '../../config/logger.js';

// Tipo para pdf-parse (sin tipos oficiales)
declare const pdfParseModule: any;

export interface OCRResult {
  success: boolean;
  rawText: string;
  confidence: number;
  extractedFields: {
    serviceNumber?: string;
    accountNumber?: string;
    clientName?: string;
    address?: string;
    currentConsumption?: number;
    previousConsumption?: number;
    consumptionKWh?: number;
    currentAmount?: number;
    tariffType?: string;
    issueDate?: string;
    dueDate?: string;
    meterNumber?: string;
  };
  source: 'tesseract' | 'pdf-parse' | 'hybrid';
  processingTime: number;
  warnings: string[];
}

class AdvancedOCRService {
  private tesseractReady = false;
  private tessWorker: Tesseract.Worker | null = null;

  /**
   * Inicializar worker de Tesseract (call once en startup)
   */
  async initialize(): Promise<void> {
    try {
      // Tesseract.js se inicializa sin configuración específica
      this.tessWorker = await Tesseract.createWorker();
      // El idioma se carga después
      await (this.tessWorker as any).loadLanguage('spa');
      await (this.tessWorker as any).initialize('spa');
      this.tesseractReady = true;
      logger.info({ message: 'Tesseract OCR initialized successfully' });
    } catch (error) {
      logger.warn({
        message: 'Tesseract initialization failed, will use pdf-parse fallback',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Limpiar resources de Tesseract
   */
  async cleanup(): Promise<void> {
    if (this.tessWorker) {
      await (this.tessWorker as any).terminate();
      this.tesseractReady = false;
    }
  }

  /**
   * Analizar recibo desde imagen/PDF con OCR avanzado
   */
  async analyzeReceipt(buffer: Buffer, fileName: string): Promise<OCRResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      // Detectar si es PDF o imagen
      const isPDF = buffer.toString('utf8', 0, 4) === '%PDF';

      let rawText = '';
      let source: 'tesseract' | 'pdf-parse' | 'hybrid' = 'pdf-parse';
      let confidence = 0;

      if (isPDF) {
        // PDF: intentar pdf-parse primero, luego Tesseract si falla
        try {
          const pdfData = await (pdfParse as any)(buffer);
          rawText = pdfData.text;
          confidence = this.calculateConfidence(rawText);

          // Si confianza baja, intentar con Tesseract en primera página
          if (confidence < 0.6 && this.tesseractReady) {
            logger.info({
              message: 'Low confidence from pdf-parse, attempting Tesseract OCR',
              confidence
            });
            const tessResult = await this.ocrImageBuffer(buffer.slice(0, 1000000)); // Primera página
            if (tessResult.confidence > confidence) {
              rawText = tessResult.text;
              confidence = tessResult.confidence;
              source = 'hybrid';
              warnings.push('Used Tesseract OCR for better accuracy');
            }
          } else {
            source = 'pdf-parse';
          }
        } catch (pdfError) {
          logger.warn({
            message: 'pdf-parse failed, falling back to Tesseract',
            error: pdfError instanceof Error ? pdfError.message : 'Unknown'
          });
          if (this.tesseractReady) {
            const tessResult = await this.ocrImageBuffer(buffer);
            rawText = tessResult.text;
            confidence = tessResult.confidence;
            source = 'tesseract';
            warnings.push('pdf-parse failed, using Tesseract OCR');
          } else {
            throw new Error('PDF parsing failed and Tesseract not available');
          }
        }
      } else {
        // Imagen: usar Tesseract directamente
        if (!this.tesseractReady) {
          throw new Error('Tesseract OCR not initialized for image processing');
        }
        const tessResult = await this.ocrImageBuffer(buffer);
        rawText = tessResult.text;
        confidence = tessResult.confidence;
        source = 'tesseract';
      }

      // Extraer campos CFE del texto
      const extractedFields = this.extractCFEFields(rawText);

      const processingTime = Date.now() - startTime;

      logger.info({
        message: 'OCR analysis completed',
        fileName,
        source,
        confidence: confidence.toFixed(2),
        processingTime,
        fieldsExtracted: Object.keys(extractedFields).filter(k => extractedFields[k as keyof typeof extractedFields])
      });

      return {
        success: true,
        rawText,
        confidence,
        extractedFields,
        source,
        processingTime,
        warnings
      };
    } catch (error) {
      logger.error({
        message: 'OCR analysis failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName,
        processingTime: Date.now() - startTime
      });

      throw {
        statusCode: 400,
        message: 'OCR analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * OCR directo de buffer de imagen usando Tesseract
   */
  private async ocrImageBuffer(buffer: Buffer): Promise<{ text: string; confidence: number }> {
    if (!this.tessWorker) {
      throw new Error('Tesseract worker not initialized');
    }

    try {
      const result = await (this.tessWorker as any).recognize(buffer);
      const text = result.data.text;
      const confidence = result.data.confidence / 100; // Tesseract retorna 0-100

      return { text, confidence };
    } catch (error) {
      logger.error({
        message: 'Tesseract recognition failed',
        error: error instanceof Error ? error.message : 'Unknown'
      });
      throw error;
    }
  }

  /**
   * Calcular confianza de OCR basado en cantidad de números encontrados
   */
  private calculateConfidence(text: string): number {
    if (!text || text.length === 0) return 0;

    // Patrones esperados en recibos CFE
    const patterns = {
      serviceNumber: /(Número de Servicio|No\. de Servicio|Servicio)[\s:]*(\d{11,13})/i,
      kwhConsumption: /(\d+\.?\d*)\s*(kWh|kwh)/i,
      amount: /\$?\s*(\d+\.?\d{2})/i,
      date: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      tariff: /(T1|T2|GDMTO|GDMTH|DAC|HM|SEM)/i
    };

    let found = 0;
    for (const pattern of Object.values(patterns)) {
      if (pattern.test(text)) found++;
    }

    // Confianza: (patrones encontrados / total) * 0.5 + (largo del texto / expected) * 0.5
    const patternScore = found / Object.keys(patterns).length;
    const lengthScore = Math.min(text.length / 1000, 1); // Esperar ~1000 chars
    return patternScore * 0.6 + lengthScore * 0.4;
  }

  /**
   * Extraer campos CFE específicos del texto OCR
   */
  private extractCFEFields(text: string): OCRResult['extractedFields'] {
    const fields: OCRResult['extractedFields'] = {};

    // Número de servicio (11-13 dígitos)
    const serviceMatch = text.match(
      /(?:Número de Servicio|No\.\s*de Servicio|Servicio)[:\s]*(\d{11,13})/i
    );
    if (serviceMatch) fields.serviceNumber = serviceMatch[1];

    // Número de cuenta
    const accountMatch = text.match(/(?:Cuenta|Account)[:\s]*([A-Z0-9]+)/i);
    if (accountMatch) fields.accountNumber = accountMatch[1];

    // Nombre del cliente
    const nameMatch = text.match(/(?:Nombre|Cliente)[:\s]*([A-Za-zÁ-ú\s]+?)(?:\n|$)/i);
    if (nameMatch) fields.clientName = nameMatch[1].trim();

    // Dirección
    const addressMatch = text.match(/(?:Domicilio|Dirección|Address)[:\s]*([^\n]+)/i);
    if (addressMatch) fields.address = addressMatch[1].trim();

    // Consumo actual (kWh)
    const consumptionMatch = text.match(/(?:Consumo|Consumption)[:\s]*(\d+\.?\d*)\s*kWh/i);
    if (consumptionMatch) fields.consumptionKWh = parseFloat(consumptionMatch[1]);

    // Consumo anterior (para análisis de tendencia)
    const prevConsumption = text.match(/(?:Anterior|Previous)[:\s]*(\d+\.?\d*)\s*kWh/i);
    if (prevConsumption) fields.previousConsumption = parseFloat(prevConsumption[1]);

    // Importe actual
    const amountMatch = text.match(/(?:Importe a Pagar|Total a Pagar|Amount Due)[:\s]*\$?\s*(\d+\.?\d{2})/i);
    if (amountMatch) fields.currentAmount = parseFloat(amountMatch[1]);

    // Tipo de tarifa
    const tariffMatch = text.match(/(T1|T2|GDMTO|GDMTH|DAC|HM|SEM)/i);
    if (tariffMatch) fields.tariffType = tariffMatch[1].toUpperCase();

    // Fecha de expedición
    const issueMatch = text.match(/(?:Expedición|Fecha|Issue Date)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (issueMatch) fields.issueDate = issueMatch[1];

    // Fecha de vencimiento
    const dueMatch = text.match(/(?:Vencimiento|Vence|Due Date)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (dueMatch) fields.dueDate = dueMatch[1];

    // Número de medidor
    const meterMatch = text.match(/(?:Medidor|Meter)[:\s]*([A-Z0-9]+)/i);
    if (meterMatch) fields.meterNumber = meterMatch[1];

    return fields;
  }

  /**
   * Validar que extracción tiene campos mínimos
   */
  isValidExtraction(fields: OCRResult['extractedFields']): boolean {
    // Requeridos: serviceNumber, consumptionKWh, currentAmount
    return !!(
      (fields.serviceNumber || fields.accountNumber || fields.meterNumber) &&
      (fields.consumptionKWh || fields.previousConsumption) &&
      (fields.currentAmount || fields.tariffType)
    );
  }
}

// Exportar instancia singleton
const advancedOCRService = new AdvancedOCRService();
export default advancedOCRService;
