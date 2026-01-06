/**
 * SERVICIO DE VALIDACIÓN OCR
 * 
 * Valida precisión de OCR comparando:
 * - Datos extraídos vs datos esperados (ground truth)
 * - Generación de métricas de precisión
 * - Análisis de errores
 * - Reportes de desempeño
 */

import logger from '../../config/logger.js';

export interface OCRValidationTest {
  testId: string;
  fileName: string;
  extractedData: { [key: string]: any };
  expectedData: { [key: string]: any };
  results: OCRValidationResult;
  timestamp: Date;
}

export interface OCRValidationResult {
  overallAccuracy: number; // 0-100%
  fieldResults: {
    [fieldName: string]: {
      expected: any;
      extracted: any;
      match: boolean;
      accuracy: number;
      errorType: 'missing' | 'incorrect' | 'none';
    };
  };
  summary: {
    totalFields: number;
    matchedFields: number;
    missedFields: number;
    incorrectFields: number;
  };
  timeProcessing: number;
  confidence: number;
  errors: string[]; // Array de errores encontrados
}

export interface OCRMetrics {
  totalTests: number;
  avgAccuracy: number;
  precisionByField: { [field: string]: number };
  commonErrors: Array<{
    field?: string;
    pattern?: string;
    frequency?: number;
    impact?: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
  timestamp: Date;
}

class OCRValidationService {
  /**
   * Validar un resultado OCR contra datos esperados
   */
  validateOCRResult(
    extracted: { [key: string]: any },
    expected: { [key: string]: any },
    processingTime: number = 0,
    confidence: number = 0.8
  ): OCRValidationResult {
    const fieldResults: OCRValidationResult['fieldResults'] = {};
    let matchedFields = 0;
    let missedFields = 0;
    let incorrectFields = 0;

    // Campos críticos (más peso en métrica general)
    const criticalFields = ['serviceNumber', 'consumptionKWh', 'currentAmount'];

    // Validar cada campo esperado
    for (const [field, expectedValue] of Object.entries(expected)) {
      const extractedValue = extracted[field];

      if (extractedValue === undefined || extractedValue === null || extractedValue === '') {
        // Campo faltante
        fieldResults[field] = {
          expected: expectedValue,
          extracted: extractedValue,
          match: false,
          accuracy: 0,
          errorType: 'missing'
        };
        missedFields++;
      } else {
        // Comparar valores
        const match = this.compareValues(expectedValue, extractedValue);
        const accuracy = match ? 100 : this.calculateFieldAccuracy(expectedValue, extractedValue);

        fieldResults[field] = {
          expected: expectedValue,
          extracted: extractedValue,
          match,
          accuracy,
          errorType: match ? 'none' : 'incorrect'
        };

        if (match) {
          matchedFields++;
        } else {
          incorrectFields++;
        }
      }
    }

    // Calcular precisión general (con peso en campos críticos)
    let totalWeight = 0;
    let weightedAccuracy = 0;

    for (const [field, result] of Object.entries(fieldResults)) {
      const weight = criticalFields.includes(field) ? 3 : 1;
      weightedAccuracy += result.accuracy * weight;
      totalWeight += weight;
    }

    const overallAccuracy = totalWeight > 0 ? Math.round((weightedAccuracy / totalWeight) * 100) / 100 : 0;

    const summary = {
      totalFields: Object.keys(expected).length,
      matchedFields,
      missedFields,
      incorrectFields
    };

    logger.info({
      message: 'OCR validation completed',
      overallAccuracy,
      matchedFields,
      missedFields,
      incorrectFields,
      processingTime
    });

    return {
      overallAccuracy,
      fieldResults,
      summary,
      timeProcessing: processingTime,
      confidence,
      errors: Object.values(fieldResults)
        .filter(r => !r.match)
        .map(r => `${r.errorType}: ${r.expected} vs ${r.extracted}`)
    };
  }

  /**
   * Comparar dos valores (con tolerancia para números)
   */
  private compareValues(expected: any, extracted: any): boolean {
    // Comparación exacta
    if (expected === extracted) return true;

    // Para strings, comparación case-insensitive
    if (typeof expected === 'string' && typeof extracted === 'string') {
      return expected.toLowerCase().trim() === extracted.toLowerCase().trim();
    }

    // Para números, permitir pequeña tolerancia (5%)
    if (typeof expected === 'number' && typeof extracted === 'number') {
      const tolerance = expected * 0.05;
      return Math.abs(expected - extracted) <= tolerance;
    }

    // Para fechas
    if (expected instanceof Date && extracted instanceof Date) {
      return expected.getTime() === extracted.getTime();
    }

    return false;
  }

  /**
   * Calcular precisión de un campo específico (0-100)
   */
  private calculateFieldAccuracy(expected: any, extracted: any): number {
    if (typeof expected === 'string' && typeof extracted === 'string') {
      // Usar Levenshtein distance para strings
      const distance = this.levenshteinDistance(
        expected.toLowerCase(),
        extracted.toLowerCase()
      );
      const maxLength = Math.max(expected.length, extracted.length);
      return Math.max(0, 100 - (distance / maxLength) * 100);
    }

    if (typeof expected === 'number' && typeof extracted === 'number') {
      // Porcentaje de desviación
      if (expected === 0) return extracted === 0 ? 100 : 0;
      const deviation = Math.abs((extracted - expected) / expected);
      return Math.max(0, 100 - deviation * 100);
    }

    return 0;
  }

  /**
   * Calcular distancia de Levenshtein entre dos strings
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Generar reporte de métricas desde múltiples validaciones
   */
  generateMetricsReport(tests: OCRValidationTest[]): OCRMetrics {
    if (tests.length === 0) {
      return {
        totalTests: 0,
        avgAccuracy: 0,
        precisionByField: {},
        commonErrors: [],
        recommendations: [],
        timestamp: new Date()
      };
    }

    // Promedio de precisión
    const avgAccuracy =
      tests.reduce((sum, t) => sum + t.results.overallAccuracy, 0) / tests.length;

    // Precisión por campo
    const precisionByField: { [field: string]: number } = {};
    const fieldCounts: { [field: string]: number } = {};

    for (const test of tests) {
      for (const [field, result] of Object.entries(test.results.fieldResults)) {
        if (!precisionByField[field]) {
          precisionByField[field] = 0;
          fieldCounts[field] = 0;
        }
        precisionByField[field] += result.accuracy;
        fieldCounts[field]++;
      }
    }

    for (const field in precisionByField) {
      precisionByField[field] = Math.round((precisionByField[field] / fieldCounts[field]) * 100) / 100;
    }

    // Errores comunes
    const errorMap: {
      [key: string]: { pattern: string; count: number; impact: 'high' | 'medium' | 'low' };
    } = {};

    const criticalFields = ['serviceNumber', 'consumptionKWh', 'currentAmount'];

    for (const test of tests) {
      for (const [field, result] of Object.entries(test.results.fieldResults)) {
        if (result.errorType !== 'none') {
          const key = `${field}:${result.errorType}`;
          const impact = criticalFields.includes(field) ? 'high' : 'medium';

          if (!errorMap[key]) {
            errorMap[key] = {
              pattern: `${field} (${result.errorType})`,
              count: 0,
              impact
            };
          }
          errorMap[key].count++;
        }
      }
    }

    const commonErrors = Object.values(errorMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(e => ({
        field: e.pattern.split('(')[0].trim(),
        pattern: e.pattern,
        frequency: e.count,
        impact: e.impact
      }));

    // Recomendaciones
    const recommendations = this.generateRecommendations(avgAccuracy, commonErrors, precisionByField);

    logger.info({
      message: 'Metrics report generated',
      totalTests: tests.length,
      avgAccuracy: avgAccuracy.toFixed(2),
      fieldsWithIssues: commonErrors.length
    });

    return {
      totalTests: tests.length,
      avgAccuracy: Math.round(avgAccuracy * 100) / 100,
      precisionByField,
      commonErrors,
      recommendations,
      timestamp: new Date()
    };
  }

  /**
   * Generar recomendaciones basadas en resultados
   */
  private generateRecommendations(
    accuracy: number,
    errors: Array<{
      field?: string;
      pattern?: string;
      frequency?: number;
      impact?: 'high' | 'medium' | 'low';
    }>,
    precisionByField: { [field: string]: number }
  ): string[] {
    const recommendations: string[] = [];

    // Precisión general
    if (accuracy < 70) {
      recommendations.push('⚠️ Precisión general baja (<70%). Requiere re-entrenamiento de modelos o análisis de dataset.');
    } else if (accuracy < 85) {
      recommendations.push('ℹ️ Precisión aceptable (70-85%). Continuar recopilando datos para mejorar.');
    } else if (accuracy >= 95) {
      recommendations.push('✅ Precisión excelente (>95%). Listo para producción con confianza alta.');
    }

    // Por campo
    const lowPrecisionFields = Object.entries(precisionByField)
      .filter(([_, p]) => p < 80)
      .map(([f, _]) => f);

    if (lowPrecisionFields.length > 0) {
      recommendations.push(`⚠️ Campos con baja precisión: ${lowPrecisionFields.join(', ')}. Requiere ajuste de regex o training.`);
    }

    // Campos críticos
    const criticalFields = ['serviceNumber', 'consumptionKWh', 'currentAmount'];
    const criticalWithIssues = criticalFields.filter(f => precisionByField[f] && precisionByField[f] < 90);

    if (criticalWithIssues.length > 0) {
      recommendations.push(`🔴 Campos críticos con error: ${criticalWithIssues.join(', ')}. Priorizar fixes.`);
    }

    // Cantidad de tests
    if (!Array.isArray(errors) || errors.length < 10) {
      recommendations.push('📊 Ejecutar más tests (recomendado: 20-50) para validación estadística.');
    }

    return recommendations;
  }

  /**
   * Generar reporte en formato HTML
   */
  generateHTMLReport(metrics: OCRMetrics): string {
    const accuracy = metrics.avgAccuracy;
    const accuracyColor = accuracy >= 90 ? '#4CAF50' : accuracy >= 80 ? '#FFC107' : '#F44336';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>OCR Validation Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    h1 { color: #333; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
    .metric { display: inline-block; background: #f9f9f9; padding: 15px; margin: 10px; border-radius: 5px; min-width: 200px; }
    .metric-value { font-size: 32px; font-weight: bold; color: ${accuracyColor}; }
    .metric-label { color: #666; font-size: 14px; }
    .field-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .field-table th { background: #667eea; color: white; padding: 10px; text-align: left; }
    .field-table td { padding: 10px; border-bottom: 1px solid #ddd; }
    .field-table tr:hover { background: #f5f5f5; }
    .good { background: #c8e6c9; color: #2e7d32; }
    .warning { background: #fff3e0; color: #f57c00; }
    .error { background: #ffcdd2; color: #c62828; }
    .recommendations { background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
    .recommendation { padding: 10px; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 OCR Validation Report</h1>
    
    <div>
      <div class="metric">
        <div class="metric-label">Overall Accuracy</div>
        <div class="metric-value">${accuracy.toFixed(2)}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">Total Tests</div>
        <div class="metric-value">${metrics.totalTests}</div>
      </div>
    </div>

    <h2>Field Precision</h2>
    <table class="field-table">
      <tr>
        <th>Field</th>
        <th>Precision</th>
        <th>Status</th>
      </tr>
      ${Object.entries(metrics.precisionByField)
        .sort(([, a], [, b]) => b - a)
        .map(([field, precision]) => {
          let rowClass = 'good';
          if (precision < 80) rowClass = 'error';
          else if (precision < 90) rowClass = 'warning';
          return `
        <tr class="${rowClass}">
          <td><strong>${field}</strong></td>
          <td>${precision.toFixed(2)}%</td>
          <td>${precision >= 90 ? '✅' : precision >= 80 ? '⚠️' : '❌'}</td>
        </tr>
          `;
        })
        .join('')}
    </table>

    <h2>Common Errors</h2>
    ${
      metrics.commonErrors.length > 0
        ? `
    <table class="field-table">
      <tr>
        <th>Error Pattern</th>
        <th>Frequency</th>
        <th>Impact</th>
      </tr>
      ${metrics.commonErrors
        .map(
          e => `
      <tr>
        <td>${e.pattern || 'Unknown'}</td>
        <td>${e.frequency || 0}</td>
        <td>
          <span class="${e.impact === 'high' ? 'error' : e.impact === 'medium' ? 'warning' : ''}" 
                style="padding: 5px; border-radius: 3px; display: inline-block;">
            ${(e.impact || 'LOW').toUpperCase()}
          </span>
        </td>
      </tr>
      `
        )
        .join('')}
    </table>
    `
        : '<p>No errors detected!</p>'
    }

    <div class="recommendations">
      <h2>Recommendations</h2>
      ${metrics.recommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('')}
    </div>

    <p style="color: #999; font-size: 12px;">
      Report generated: ${metrics.timestamp.toLocaleString('es-MX')}
    </p>
  </div>
</body>
</html>
    `;
  }
}

export default new OCRValidationService();
