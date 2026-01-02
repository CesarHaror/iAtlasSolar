/**
 * RUTAS DE IA - FASE 4
 * Endpoints para:
 * - OCR Avanzado
 * - Análisis de Consumo
 * - Generación de Cotizaciones
 * - Generación de Emails
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate } from '../../shared/middleware/auth.js';
import { ocrLimiter } from '../../middleware/rateLimiter.js';
import { validateFileType, validateFileSize } from '../../middleware/validation.js';
import advancedOCRService from './ocr-advanced.service.js';
import consumptionAnalysisService from './consumption-analysis.service.js';
import quotationGeneratorService from './quotation-generator.service.js';
import emailGeneratorService from './email-generator.service.js';
import logger from '../../config/logger.js';

const router = Router();

// Configuración de multer para análisis OCR
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan PDFs e imágenes'));
    }
  }
});

// =====================================================
// OCR AVANZADO ENDPOINT
// =====================================================

/**
 * POST /api/ai/ocr/analyze-advanced
 * Analizar recibo con Tesseract OCR avanzado
 * Rate limited: 50 por hora
 */
router.post(
  '/ocr/analyze-advanced',
  authenticate,
  ocrLimiter,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'Archivo requerido'
        });
      }

      logger.info({
        message: 'Advanced OCR analysis requested',
        fileName: req.file.originalname,
        fileSize: req.file.size,
        userId: (req.user as any)?.userId || (req.user as any)?.id
      });

      const result = await advancedOCRService.analyzeReceipt(
        req.file.buffer,
        req.file.originalname
      );

      // Validar extracción
      const isValid = advancedOCRService.isValidExtraction(result.extractedFields);
      if (!isValid && result.confidence < 0.5) {
        logger.warn({
          message: 'OCR result has low confidence',
          confidence: result.confidence,
          fileName: req.file.originalname
        });
      }

      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

// =====================================================
// ANÁLISIS DE CONSUMO ENDPOINT
// =====================================================

/**
 * POST /api/ai/consumption/analyze
 * Analizar histórico de consumo y generar predicciones
 */
router.post(
  '/consumption/analyze',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { historicalData } = req.body;

      if (!Array.isArray(historicalData) || historicalData.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Se requiere array de historicalData con al menos 3 puntos'
        });
      }

      logger.info({
        message: 'Consumption analysis requested',
        dataPoints: historicalData.length,
        userId: (req.user as any)?.userId || (req.user as any)?.id
      });

      const analysis = consumptionAnalysisService.analyze(historicalData);

      res.json({
        status: 'success',
        data: analysis
      });
    } catch (error) {
      next(error);
    }
  }
);

// =====================================================
// GENERACIÓN AUTOMÁTICA DE COTIZACIONES
// =====================================================

/**
 * POST /api/ai/quotations/generate-from-ocr
 * Generar cotización automáticamente desde datos OCR
 */
router.post(
  '/quotations/generate-from-ocr',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ocrData = req.body;

      // Validar datos mínimos
      if (!ocrData.serviceNumber || !ocrData.consumptionKWh) {
        return res.status(400).json({
          status: 'error',
          message: 'Se requiere serviceNumber y consumptionKWh'
        });
      }

      logger.info({
        message: 'Auto-generate quotation requested',
        serviceNumber: ocrData.serviceNumber,
        consumption: ocrData.consumptionKWh,
        userId: (req.user as any)?.userId || (req.user as any)?.id
      });

      const quotation = quotationGeneratorService.generateFromOCR(ocrData);

      // Validar que no sea anómala
      const validation = quotationGeneratorService.validateQuotation(quotation.quotation);
      if (!validation.valid) {
        logger.warn({
          message: 'Generated quotation has validation issues',
          issues: validation.issues
        });
      }

      res.json({
        status: 'success',
        data: quotation
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/ai/quotations/enrich
 * Enriquecer cotización con datos adicionales
 */
router.post(
  '/quotations/enrich',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { quotation, enrichmentData } = req.body;

      if (!quotation) {
        return res.status(400).json({
          status: 'error',
          message: 'Quotation requerida'
        });
      }

      logger.info({
        message: 'Quotation enrichment requested',
        enrichmentFactors: Object.keys(enrichmentData || {})
      });

      const enriched = quotationGeneratorService.enrichQuotation(quotation, enrichmentData);

      res.json({
        status: 'success',
        data: { quotation: enriched }
      });
    } catch (error) {
      next(error);
    }
  }
);

// =====================================================
// GENERACIÓN DE EMAILS CON IA
// =====================================================

/**
 * POST /api/ai/emails/generate-proposal
 * Generar email de propuesta personalizado
 */
router.post(
  '/emails/generate-proposal',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const emailData = req.body;

      // Validar requeridos
      if (!emailData.clientName || !emailData.clientEmail || !emailData.systemSize) {
        return res.status(400).json({
          status: 'error',
          message: 'Se requiere clientName, clientEmail y systemSize'
        });
      }

      logger.info({
        message: 'Proposal email generation requested',
        clientEmail: emailData.clientEmail,
        systemSize: emailData.systemSize
      });

      const email = emailGeneratorService.generateProposalEmail(emailData);

      res.json({
        status: 'success',
        data: email
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/ai/emails/generate-analysis
 * Generar email de análisis de consumo
 */
router.post(
  '/emails/generate-analysis',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const emailData = req.body;

      if (!emailData.clientName || !emailData.clientEmail) {
        return res.status(400).json({
          status: 'error',
          message: 'Se requiere clientName y clientEmail'
        });
      }

      logger.info({
        message: 'Analysis email generation requested',
        clientEmail: emailData.clientEmail
      });

      const email = emailGeneratorService.generateAnalysisEmail(emailData);

      res.json({
        status: 'success',
        data: email
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/ai/emails/generate-followup
 * Generar email de seguimiento
 */
router.post(
  '/emails/generate-followup',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const emailData = req.body;

      if (!emailData.clientName || !emailData.clientEmail || emailData.daysElapsed === undefined) {
        return res.status(400).json({
          status: 'error',
          message: 'Se requiere clientName, clientEmail y daysElapsed'
        });
      }

      logger.info({
        message: 'Follow-up email generation requested',
        clientEmail: emailData.clientEmail,
        daysElapsed: emailData.daysElapsed
      });

      const email = emailGeneratorService.generateFollowUpEmail(emailData);

      res.json({
        status: 'success',
        data: email
      });
    } catch (error) {
      next(error);
    }
  }
);

// =====================================================
// HEALTH CHECK
// =====================================================

/**
 * GET /api/ai/health
 * Verificar estado de servicios de IA
 */
router.get('/health', authenticate, async (req: Request, res: Response) => {
  res.json({
    status: 'success',
    data: {
      ocr: {
        status: 'ready',
        type: 'Tesseract.js + pdf-parse',
        languages: ['Spanish', 'English']
      },
      consumption_analysis: {
        status: 'ready',
        features: ['trends', 'seasonality', 'forecast', 'anomalies', 'recommendations']
      },
      quotation_generator: {
        status: 'ready',
        autoGeneration: true
      },
      email_generator: {
        status: 'ready',
        templates: ['proposal', 'analysis', 'follow_up']
      }
    }
  });
});

export default router;
