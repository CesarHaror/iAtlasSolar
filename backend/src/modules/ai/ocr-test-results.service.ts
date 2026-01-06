/**
 * OCR TEST RESULTS SERVICE
 * 
 * Gestiona almacenamiento y recuperación de resultados de OCR
 * desde PostgreSQL
 */

import { PrismaClient } from '@prisma/client';
import logger from '../../config/logger.js';

const prisma = new PrismaClient();

export interface OCRTestResultInput {
  testId: string;
  fileName: string;
  fileType: string;
  extractedData: Record<string, any>;
  groundTruth: Record<string, any>;
  overallAccuracy: number;
  fieldResults: Record<string, any>;
  errors: any[];
  processingTime: number;
  ocrConfidence: number;
  createdBy?: string;
  batchId?: string;
}

export interface OCRTestBatchInput {
  batchId: string;
  name: string;
  description?: string;
  totalTests: number;
  createdBy?: string;
}

class OCRTestResultsService {
  /**
   * Guardar un resultado de test individual en BD
   */
  async saveTestResult(input: OCRTestResultInput) {
    try {
      const result = await prisma.oCRTestResult.create({
        data: {
          testId: input.testId,
          fileName: input.fileName,
          fileType: input.fileType,
          extractedData: input.extractedData,
          groundTruth: input.groundTruth,
          overallAccuracy: input.overallAccuracy,
          fieldResults: input.fieldResults,
          errors: input.errors,
          processingTime: input.processingTime,
          ocrConfidence: input.ocrConfidence,
          createdBy: input.createdBy,
          batchId: input.batchId,
          // Calcular accuracy de campos críticos
          criticalAccuracy: this.calculateCriticalAccuracy(input.fieldResults)
        }
      });

      logger.info({
        message: 'OCR test result saved to database',
        testId: input.testId,
        accuracy: input.overallAccuracy
      });

      return result;
    } catch (error) {
      logger.error({
        message: 'Error saving OCR test result',
        error: error instanceof Error ? error.message : 'Unknown',
        testId: input.testId
      });
      throw error;
    }
  }

  /**
   * Crear un batch de tests
   */
  async createBatch(input: OCRTestBatchInput) {
    try {
      const batch = await prisma.oCRTestBatch.create({
        data: {
          batchId: input.batchId,
          name: input.name,
          description: input.description,
          totalTests: input.totalTests,
          createdBy: input.createdBy,
          status: 'PROCESSING'
        }
      });

      logger.info({
        message: 'OCR test batch created',
        batchId: input.batchId,
        totalTests: input.totalTests
      });

      return batch;
    } catch (error) {
      logger.error({
        message: 'Error creating OCR batch',
        error: error instanceof Error ? error.message : 'Unknown'
      });
      throw error;
    }
  }

  /**
   * Actualizar batch con métricas finales
   */
  async completeBatch(batchId: string, metrics: {
    avgAccuracy: number;
    avgProcessingTime: number;
    processedCount: number;
    errorCount: number;
  }) {
    try {
      const batch = await prisma.oCRTestBatch.update({
        where: { batchId },
        data: {
          avgAccuracy: metrics.avgAccuracy,
          avgProcessingTime: metrics.avgProcessingTime,
          processedCount: metrics.processedCount,
          errorCount: metrics.errorCount,
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      logger.info({
        message: 'OCR batch completed',
        batchId,
        avgAccuracy: metrics.avgAccuracy
      });

      return batch;
    } catch (error) {
      logger.error({
        message: 'Error completing OCR batch',
        error: error instanceof Error ? error.message : 'Unknown'
      });
      throw error;
    }
  }

  /**
   * Obtener un test por ID
   */
  async getTestResult(testId: string) {
    try {
      const result = await prisma.oCRTestResult.findUnique({
        where: { testId }
      });

      return result;
    } catch (error) {
      logger.error({
        message: 'Error retrieving OCR test result',
        error: error instanceof Error ? error.message : 'Unknown'
      });
      throw error;
    }
  }

  /**
   * Obtener todos los tests con paginación
   */
  async getTestResults(options: {
    limit?: number;
    offset?: number;
    batchId?: string;
    status?: string;
  } = {}) {
    try {
      const limit = Math.min(options.limit || 50, 1000);
      const offset = options.offset || 0;

      const where: any = {};
      if (options.batchId) where.batchId = options.batchId;
      if (options.status) where.status = options.status;

      const [results, total] = await Promise.all([
        prisma.oCRTestResult.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.oCRTestResult.count({ where })
      ]);

      return {
        results,
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error({
        message: 'Error retrieving OCR test results',
        error: error instanceof Error ? error.message : 'Unknown'
      });
      throw error;
    }
  }

  /**
   * Obtener batch por ID
   */
  async getBatch(batchId: string) {
    try {
      const batch = await prisma.oCRTestBatch.findUnique({
        where: { batchId },
        include: {
          results: {
            select: {
              testId: true,
              fileName: true,
              overallAccuracy: true,
              processingTime: true,
              createdAt: true
            }
          }
        }
      });

      return batch;
    } catch (error) {
      logger.error({
        message: 'Error retrieving OCR batch',
        error: error instanceof Error ? error.message : 'Unknown'
      });
      throw error;
    }
  }

  /**
   * Obtener todas los batches
   */
  async getBatches(options: {
    limit?: number;
    offset?: number;
    status?: string;
  } = {}) {
    try {
      const limit = Math.min(options.limit || 50, 1000);
      const offset = options.offset || 0;

      const where: any = {};
      if (options.status) where.status = options.status;

      const [batches, total] = await Promise.all([
        prisma.oCRTestBatch.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.oCRTestBatch.count({ where })
      ]);

      return {
        batches,
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error({
        message: 'Error retrieving OCR batches',
        error: error instanceof Error ? error.message : 'Unknown'
      });
      throw error;
    }
  }

  /**
   * Obtener métricas agregadas
   */
  async getMetrics(options: {
    batchId?: string;
    daysBack?: number;
  } = {}) {
    try {
      const daysBack = options.daysBack || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const where: any = {
        createdAt: { gte: startDate }
      };
      if (options.batchId) where.batchId = options.batchId;

      const results = await prisma.oCRTestResult.findMany({
        where,
        select: {
          overallAccuracy: true,
          fieldResults: true,
          processingTime: true,
          createdAt: true
        }
      });

      if (results.length === 0) {
        return {
          totalTests: 0,
          avgAccuracy: 0,
          minAccuracy: 0,
          maxAccuracy: 0,
          avgProcessingTime: 0,
          fieldMetrics: {}
        };
      }

      // Calcular métricas
      const accuracies = results.map(r => r.overallAccuracy);
      const times = results.map(r => r.processingTime);

      const avgAccuracy = Math.round((accuracies.reduce((a, b) => a + b) / accuracies.length) * 100) / 100;
      const minAccuracy = Math.min(...accuracies);
      const maxAccuracy = Math.max(...accuracies);
      const avgTime = Math.round(times.reduce((a, b) => a + b) / times.length);

      // Métricas por campo
      const fieldMetrics: Record<string, any> = {};
      for (const result of results) {
        const fields = result.fieldResults as Record<string, any>;
        for (const [field, data] of Object.entries(fields)) {
          if (!fieldMetrics[field]) {
            fieldMetrics[field] = { accuracies: [], count: 0 };
          }
          fieldMetrics[field].accuracies.push((data as any).accuracy || 0);
          fieldMetrics[field].count++;
        }
      }

      // Calcular promedios por campo
      const fieldMetricsSummary: Record<string, number> = {};
      for (const [field, data] of Object.entries(fieldMetrics)) {
        const fieldData = data as any;
        const avg = fieldData.accuracies.reduce((a: number, b: number) => a + b, 0) / fieldData.count;
        fieldMetricsSummary[field] = Math.round(avg * 100) / 100;
      }

      return {
        totalTests: results.length,
        avgAccuracy,
        minAccuracy: Math.round(minAccuracy * 100) / 100,
        maxAccuracy: Math.round(maxAccuracy * 100) / 100,
        avgProcessingTime: avgTime,
        fieldMetrics: fieldMetricsSummary,
        daysBack
      };
    } catch (error) {
      logger.error({
        message: 'Error calculating OCR metrics',
        error: error instanceof Error ? error.message : 'Unknown'
      });
      throw error;
    }
  }

  /**
   * Eliminar resultados antiguos
   */
  async deleteOldResults(daysOld: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.oCRTestResult.deleteMany({
        where: {
          createdAt: { lt: cutoffDate }
        }
      });

      logger.info({
        message: 'Old OCR results deleted',
        deletedCount: result.count,
        daysOld
      });

      return result;
    } catch (error) {
      logger.error({
        message: 'Error deleting old OCR results',
        error: error instanceof Error ? error.message : 'Unknown'
      });
      throw error;
    }
  }

  /**
   * Calcular accuracy de campos críticos
   */
  private calculateCriticalAccuracy(fieldResults: Record<string, any>): number {
    const criticalFields = ['serviceNumber', 'consumptionKWh', 'currentAmount'];
    const criticalAccuracies = [];

    for (const field of criticalFields) {
      if (fieldResults[field]) {
        criticalAccuracies.push(fieldResults[field].accuracy || 0);
      }
    }

    if (criticalAccuracies.length === 0) return 0;

    const sum = criticalAccuracies.reduce((a, b) => a + b, 0);
    return Math.round((sum / criticalAccuracies.length) * 100) / 100;
  }
}

// Exportar singleton
export default new OCRTestResultsService();
