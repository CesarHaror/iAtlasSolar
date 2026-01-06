/**
 * DATASET TESTING ROUTES
 * 
 * Endpoints para generar y gestionar datasets de testing
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../shared/middleware/auth.js';
import testingDataGenerator from './testing-data.generator.js';
import logger from '../../config/logger.js';

const router = Router();

/**
 * POST /api/testing/dataset/generate
 * Generar un dataset de testing aleatorio
 */
router.post(
  '/generate',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { count = 10, includeVariations = true } = req.body;

      // Validar count
      const sampleCount = Math.min(Math.max(parseInt(count as string) || 10, 1), 100);

      logger.info({
        message: 'Generating test dataset',
        sampleCount,
        includeVariations
      });

      const dataset = testingDataGenerator.generateTestDataset(sampleCount, {
        includeVariations
      });

      res.json({
        status: 'success',
        data: dataset
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/testing/dataset/examples
 * Obtener ejemplos predefinidos de recibos CFE
 */
router.get('/examples', authenticate, (req: Request, res: Response) => {
  const examples = testingDataGenerator.TESTING_EXAMPLES;

  res.json({
    status: 'success',
    data: {
      description: 'Ejemplos predefinidos de recibos CFE para testing',
      examples: {
        domestico_basico: {
          type: 'Doméstico (Bajo consumo)',
          data: examples.domestico_basico
        },
        domestico_alto_consumo: {
          type: 'Doméstico (Alto consumo)',
          data: examples.domestico_alto_consumo
        },
        comercial: {
          type: 'Comercial',
          data: examples.comercial
        },
        industrial: {
          type: 'Industrial',
          data: examples.industrial
        }
      }
    }
  });
});

/**
 * GET /api/testing/dataset/template
 * Obtener plantilla para crear ground truth manualmente
 */
router.get('/template', authenticate, (req: Request, res: Response) => {
  const template = testingDataGenerator.SAMPLE_CFE_RECEIPT_TEMPLATE;

  res.json({
    status: 'success',
    data: {
      description: 'Plantilla de recibo CFE para crear ground truth',
      template,
      instructions: {
        serviceNumber: 'Número de servicio (12 dígitos)',
        clientName: 'Nombre del cliente',
        address: 'Domicilio del cliente',
        billingPeriod: 'Período de facturación (ej: Enero 2024)',
        issueDate: 'Fecha de emisión (YYYY-MM-DD)',
        dueDate: 'Fecha de vencimiento (YYYY-MM-DD)',
        consumptionKWh: 'Consumo en kWh (número)',
        rate: 'Tarifa aplicada',
        consumption: 'Tipo de consumo (Normal, Alto, etc)',
        currentAmount: 'Monto a pagar (número con decimales)',
        previousReading: 'Lectura anterior (número)',
        currentReading: 'Lectura actual (número)',
        billingDays: 'Días de facturación (número)'
      }
    }
  });
});

/**
 * POST /api/testing/dataset/validate-structure
 * Validar que un ground truth tenga la estructura correcta
 */
router.post(
  '/validate-structure',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data } = req.body;

      if (!data) {
        return res.status(400).json({
          status: 'error',
          message: 'Se requiere campo "data" con el ground truth'
        });
      }

      const validation = testingDataGenerator.validateGroundTruthStructure(data);

      res.json({
        status: 'success',
        data: validation
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/testing/dataset/export/csv
 * Exportar dataset como CSV
 */
router.get('/export/csv', authenticate, (req: Request, res: Response) => {
  const count = Math.min(parseInt(req.query.count as string) || 20, 100);

  const csv = testingDataGenerator.generateTestingCSV(count);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="testing-dataset.csv"');
  res.send(csv);
});

/**
 * GET /api/testing/dataset/export/json
 * Exportar dataset como JSON
 */
router.get('/export/json', authenticate, (req: Request, res: Response) => {
  const count = Math.min(parseInt(req.query.count as string) || 20, 100);

  const dataset = testingDataGenerator.generateTestDataset(count, { includeVariations: true });

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="testing-dataset.json"');
  res.json(dataset);
});

/**
 * POST /api/testing/dataset/sample-single
 * Generar UN SOLO recibo de ejemplo (para testing rápido)
 */
router.post(
  '/sample-single',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type = 'domestico' } = req.body;

      let groundTruth = testingDataGenerator.TESTING_EXAMPLES.domestico_basico;

      switch (type) {
        case 'domestico-alto':
          groundTruth = testingDataGenerator.TESTING_EXAMPLES.domestico_alto_consumo;
          break;
        case 'comercial':
          groundTruth = testingDataGenerator.TESTING_EXAMPLES.comercial;
          break;
        case 'industrial':
          groundTruth = testingDataGenerator.TESTING_EXAMPLES.industrial;
          break;
      }

      res.json({
        status: 'success',
        data: {
          type,
          groundTruth,
          instructions: {
            step1: 'Usar este ground truth para validar OCR',
            step2: 'Enviar a POST /api/testing/ocr/validate-single con archivo PDF/imagen',
            step3: 'Obtener métricas de precisión'
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/testing/dataset/health
 * Estado del servicio de datasets
 */
router.get('/health', authenticate, (req: Request, res: Response) => {
  res.json({
    status: 'success',
    data: {
      dataset_service: 'operational',
      features: {
        random_generation: true,
        predefined_examples: true,
        csv_export: true,
        json_export: true,
        structure_validation: true
      },
      max_samples: 100
    }
  });
});

export default router;
