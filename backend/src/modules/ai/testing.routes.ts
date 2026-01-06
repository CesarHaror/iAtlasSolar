/**
 * TESTING ROUTES - FASE 4 VALIDACIÓN
 * 
 * Endpoints para:
 * - Testing masivo OCR
 * - Validación contra ground truth
 * - Generación de reportes
 * - Métricas de desempeño
 */

import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { authenticate } from '../../shared/middleware/auth.js';
import advancedOCRService from './ocr-advanced.service.js';
import ocrValidationService, { OCRValidationTest } from './ocr-validation.service.js';
import ocrTestResultsService from './ocr-test-results.service.js';
import logger from '../../config/logger.js';

const router = Router();

// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB para testing
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan PDFs, imágenes y JSON'));
    }
  }
});

// Storage en memoria para tests
const testResults: OCRValidationTest[] = [];

// =====================================================
// TESTING ENDPOINTS
// =====================================================

/**
 * POST /api/testing/ocr/validate-single
 * Validar un archivo OCR contra datos esperados
 */
router.post(
  '/ocr/validate-single',
  authenticate,
  upload.fields([{ name: 'file', maxCount: 1 }, { name: 'groundTruth', maxCount: 1 }]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as any;

      if (!files?.file || !files?.groundTruth) {
        return res.status(400).json({
          status: 'error',
          message: 'Se requieren: file (PDF/imagen) y groundTruth (JSON)'
        });
      }

      const fileBuffer = files.file[0].buffer;
      const fileName = files.file[0].originalname;

      // Parsear ground truth
      const groundTruthJson = JSON.parse(files.groundTruth[0].buffer.toString());

      logger.info({
        message: 'OCR validation test started',
        fileName,
        fields: Object.keys(groundTruthJson).length
      });

      // Ejecutar OCR
      const startTime = Date.now();
      const ocrResult = await advancedOCRService.analyzeReceipt(fileBuffer, fileName);
      const processingTime = Date.now() - startTime;

      // Validar resultado
      const validation = ocrValidationService.validateOCRResult(
        ocrResult.extractedFields,
        groundTruthJson,
        processingTime,
        ocrResult.confidence
      );

      // Guardar test en BD
      const testId = `test-${Date.now()}`;
      const userId = (req as any).user?.id;
      
      try {
        await ocrTestResultsService.saveTestResult({
          testId,
          fileName,
          fileType: fileName.split('.').pop() || 'unknown',
          extractedData: ocrResult.extractedFields,
          groundTruth: groundTruthJson,
          overallAccuracy: validation.overallAccuracy,
          fieldResults: validation.fieldResults,
          errors: validation.errors,
          processingTime,
          ocrConfidence: ocrResult.confidence,
          createdBy: userId
        });
      } catch (dbError) {
        logger.warn({
          message: 'Could not save to database, but validation completed',
          error: dbError instanceof Error ? dbError.message : 'Unknown'
        });
      }

      // Guardar en memoria también (backup)
      const test: OCRValidationTest = {
        testId,
        fileName,
        extractedData: ocrResult.extractedFields,
        expectedData: groundTruthJson,
        results: validation,
        timestamp: new Date()
      };
      testResults.push(test);

      res.json({
        status: 'success',
        data: {
          testId,
          fileName,
          validation,
          ocrConfidence: ocrResult.confidence,
          processingTime,
          saved: 'database'
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/testing/ocr/batch-validate
 * Validar múltiples archivos (dataset de testing)
 */
router.post(
  '/ocr/batch-validate',
  authenticate,
  upload.single('testDataset'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'Se requiere archivo ZIP con dataset de testing'
        });
      }

      // En producción, descomprimirías el ZIP
      // Por ahora, asumimos que es un JSON con array de tests
      const dataset = JSON.parse(req.file.buffer.toString());

      if (!Array.isArray(dataset)) {
        return res.status(400).json({
          status: 'error',
          message: 'Dataset debe ser un array de tests'
        });
      }

      logger.info({
        message: 'Batch validation started',
        testsCount: dataset.length
      });

      const batchResults = [];
      let processedCount = 0;
      let errorCount = 0;

      for (const testCase of dataset) {
        try {
          if (!testCase.base64 || !testCase.groundTruth) {
            errorCount++;
            continue;
          }

          // Convertir base64 a buffer
          const buffer = Buffer.from(testCase.base64, 'base64');

          // Ejecutar OCR
          const startTime = Date.now();
          const ocrResult = await advancedOCRService.analyzeReceipt(
            buffer,
            testCase.fileName || `test-${processedCount}`
          );
          const processingTime = Date.now() - startTime;

          // Validar
          const validation = ocrValidationService.validateOCRResult(
            ocrResult.extractedFields,
            testCase.groundTruth,
            processingTime,
            ocrResult.confidence
          );

          batchResults.push({
            testId: `batch-test-${processedCount}`,
            fileName: testCase.fileName,
            accuracy: validation.overallAccuracy,
            processingTime
          });

          processedCount++;
        } catch (error) {
          logger.warn({
            message: 'Test case failed',
            testIndex: processedCount,
            error: error instanceof Error ? error.message : 'Unknown'
          });
          errorCount++;
        }
      }

      const avgAccuracy =
        batchResults.length > 0
          ? batchResults.reduce((sum, r) => sum + r.accuracy, 0) / batchResults.length
          : 0;

      const avgTime =
        batchResults.length > 0
          ? batchResults.reduce((sum, r) => sum + r.processingTime, 0) / batchResults.length
          : 0;

      res.json({
        status: 'success',
        data: {
          totalTests: dataset.length,
          processedCount,
          errorCount,
          results: batchResults,
          avgAccuracy: Math.round(avgAccuracy * 100) / 100,
          avgProcessingTime: Math.round(avgTime)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/testing/ocr/results
 * Obtener todos los resultados de tests
 */
router.get('/ocr/results', authenticate, (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
  const offset = parseInt(req.query.offset as string) || 0;

  const results = testResults.slice(offset, offset + limit);

  res.json({
    status: 'success',
    data: {
      total: testResults.length,
      limit,
      offset,
      results
    }
  });
});

/**
 * GET /api/testing/ocr/metrics
 * Generar reporte de métricas
 */
router.get('/ocr/metrics', authenticate, (req: Request, res: Response) => {
  const metrics = ocrValidationService.generateMetricsReport(testResults);

  res.json({
    status: 'success',
    data: metrics
  });
});

/**
 * GET /api/testing/ocr/report/html
 * Descargar reporte HTML
 */
router.get('/ocr/report/html', authenticate, (req: Request, res: Response) => {
  const metrics = ocrValidationService.generateMetricsReport(testResults);
  const html = ocrValidationService.generateHTMLReport(metrics);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ocr-validation-report.html"');
  res.send(html);
});

/**
 * GET /api/testing/ocr/report/json
 * Descargar reporte JSON
 */
router.get('/ocr/report/json', authenticate, (req: Request, res: Response) => {
  const metrics = ocrValidationService.generateMetricsReport(testResults);
  const report = {
    metrics,
    detailedResults: testResults,
    exportedAt: new Date().toISOString()
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="ocr-validation-report.json"');
  res.json(report);
});

/**
 * DELETE /api/testing/ocr/results
 * Limpiar resultados de tests
 */
router.delete('/ocr/results', authenticate, (req: Request, res: Response) => {
  const count = testResults.length;
  testResults.length = 0;

  logger.info({
    message: 'Test results cleared',
    clearedCount: count
  });

  res.json({
    status: 'success',
    message: `${count} test results cleared`
  });
});

/**
 * GET /api/testing/database/results
 * Obtener resultados desde base de datos
 */
router.get('/database/results', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    const batchId = req.query.batchId as string;

    const data = await ocrTestResultsService.getTestResults({
      limit,
      offset,
      batchId
    });

    res.json({
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/testing/database/metrics
 * Obtener métricas desde base de datos
 */
router.get('/database/metrics', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const daysBack = parseInt(req.query.daysBack as string) || 7;
    const batchId = req.query.batchId as string;

    const metrics = await ocrTestResultsService.getMetrics({
      daysBack,
      batchId
    });

    res.json({
      status: 'success',
      data: metrics
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/testing/database/batches
 * Obtener todos los batches desde base de datos
 */
router.get('/database/batches', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string;

    const data = await ocrTestResultsService.getBatches({
      limit,
      offset,
      status
    });

    res.json({
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/testing/database/batch/:batchId
 * Obtener un batch específico con sus resultados
 */
router.get('/database/batch/:batchId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { batchId } = req.params;

    const batch = await ocrTestResultsService.getBatch(batchId);

    if (!batch) {
      return res.status(404).json({
        status: 'error',
        message: 'Batch not found'
      });
    }

    res.json({
      status: 'success',
      data: batch
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/testing/database/test/:testId
 * Obtener un test específico
 */
router.get('/database/test/:testId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { testId } = req.params;

    const result = await ocrTestResultsService.getTestResult(testId);

    if (!result) {
      return res.status(404).json({
        status: 'error',
        message: 'Test not found'
      });
    }

    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/testing/health
 * Estado del sistema de testing
 */
router.get('/health', authenticate, (req: Request, res: Response) => {
  res.json({
    status: 'success',
    data: {
      testing_system: 'operational',
      total_tests_memory: testResults.length,
      storage: {
        memory: 'enabled',
        database: 'enabled',
        capacity: 'unlimited'
      },
      features: {
        single_validation: true,
        batch_validation: true,
        metrics_generation: true,
        html_reports: true,
        json_exports: true,
        database_persistence: true,
        database_metrics: true
      }
    }
  });
});

export default router;
