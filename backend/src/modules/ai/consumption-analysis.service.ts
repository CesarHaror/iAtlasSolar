/**
 * SERVICIO DE ANÁLISIS DE CONSUMO
 * 
 * Proporciona análisis predictivo de consumo eléctrico:
 * - Tendencias de consumo
 * - Detección de estacionalidad
 * - Pronóstico de consumo futuro
 * - Detección de anomalías
 * - Recomendaciones de ahorro
 */

import ss from 'simple-statistics';
import logger from '../../config/logger.js';

export interface ConsumptionDataPoint {
  date: Date;
  consumption: number; // kWh
  temperature?: number; // °C
  cost?: number; // $
}

export interface ConsumptionAnalysis {
  historicalData: ConsumptionDataPoint[];
  statistics: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
  };
  trends: {
    direction: 'increasing' | 'decreasing' | 'stable';
    percentageChange: number;
    slope: number;
  };
  seasonality: {
    detected: boolean;
    pattern: string;
    seasonalFactor: number;
  };
  forecast: {
    nextMonth: number;
    next3Months: number[];
    next12Months: number[];
    confidence: number;
  };
  anomalies: {
    detected: boolean;
    points: Array<{
      date: Date;
      consumption: number;
      deviation: number;
      severity: 'low' | 'medium' | 'high';
    }>;
  };
  recommendations: {
    savings: string[];
    potentialSavings: number; // % de reducción posible
  };
}

class ConsumptionAnalysisService {
  /**
   * Analizar consumo histórico y generar predicciones
   */
  analyze(historicalData: ConsumptionDataPoint[]): ConsumptionAnalysis {
    if (historicalData.length < 3) {
      throw {
        statusCode: 400,
        message: 'Se requieren al menos 3 puntos de datos históricos para análisis',
        details: { provided: historicalData.length }
      };
    }

    const sortedData = [...historicalData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const consumptions = sortedData.map(d => d.consumption);

    // Estadísticas básicas
    const statistics = {
      mean: ss.mean(consumptions),
      median: ss.median(consumptions),
      stdDev: ss.standardDeviation(consumptions),
      min: Math.min(...consumptions),
      max: Math.max(...consumptions)
    };

    // Tendencias
    const trends = this.analyzeTrends(sortedData);

    // Estacionalidad
    const seasonality = this.detectSeasonality(sortedData);

    // Pronóstico
    const forecast = this.generateForecast(sortedData, seasonality);

    // Anomalías
    const anomalies = this.detectAnomalies(consumptions, statistics);

    // Recomendaciones
    const recommendations = this.generateRecommendations(
      trends,
      seasonality,
      statistics,
      anomalies
    );

    logger.info({
      message: 'Consumption analysis completed',
      dataPoints: historicalData.length,
      trendDirection: trends.direction,
      anomaliesDetected: anomalies.detected,
      forecastConfidence: forecast.confidence
    });

    return {
      historicalData: sortedData,
      statistics,
      trends,
      seasonality,
      forecast,
      anomalies,
      recommendations
    };
  }

  /**
   * Analizar tendencia de consumo
   */
  private analyzeTrends(data: ConsumptionDataPoint[]): ConsumptionAnalysis['trends'] {
    if (data.length < 2) {
      return {
        direction: 'stable',
        percentageChange: 0,
        slope: 0
      };
    }

    const consumptions = data.map(d => d.consumption);
    const firstHalf = consumptions.slice(0, Math.floor(consumptions.length / 2));
    const secondHalf = consumptions.slice(Math.floor(consumptions.length / 2));

    const avgFirst = ss.mean(firstHalf);
    const avgSecond = ss.mean(secondHalf);
    const percentageChange = ((avgSecond - avgFirst) / avgFirst) * 100;

    // Calcular slope usando indices como X
    const slope = this.linearRegression(
      consumptions.map((_, i) => i),
      consumptions
    );

    return {
      direction:
        percentageChange > 5 ? 'increasing' :
        percentageChange < -5 ? 'decreasing' :
        'stable',
      percentageChange: Math.round(percentageChange * 100) / 100,
      slope: Math.round(slope * 10000) / 10000
    };
  }

  /**
   * Detectar patrones de estacionalidad
   */
  private detectSeasonality(data: ConsumptionDataPoint[]): ConsumptionAnalysis['seasonality'] {
    if (data.length < 12) {
      return {
        detected: false,
        pattern: 'insufficient_data',
        seasonalFactor: 1
      };
    }

    // Agrupar por mes
    const monthlyData = this.groupByMonth(data);
    if (monthlyData.length < 12) {
      return {
        detected: false,
        pattern: 'insufficient_months',
        seasonalFactor: 1
      };
    }

    // Calcular promedio mensual
    const monthlyAvg = monthlyData.map(m => ss.mean(m));
    const overallAvg = ss.mean(monthlyAvg);

    // Detectar estacionalidad comparando varianza
    const seasonalFactors = monthlyAvg.map(m => m / overallAvg);
    const factorVariance = ss.variance(seasonalFactors);

    const isSeasonalityDetected = factorVariance > 0.01; // Umbral de varianza

    // Identificar patrón
    let pattern = 'none';
    if (isSeasonalityDetected) {
      const summer = (monthlyAvg[5] + monthlyAvg[6] + monthlyAvg[7]) / 3; // Jun-Jul-Ago
      const winter = (monthlyAvg[0] + monthlyAvg[1] + monthlyAvg[11]) / 3; // Dic-Ene-Feb
      pattern = summer > winter ? 'summer_peak' : 'winter_peak';
    }

    return {
      detected: isSeasonalityDetected,
      pattern,
      seasonalFactor: Math.max(...seasonalFactors)
    };
  }

  /**
   * Generar pronóstico de consumo futuro
   */
  private generateForecast(
    data: ConsumptionDataPoint[],
    seasonality: ConsumptionAnalysis['seasonality']
  ): ConsumptionAnalysis['forecast'] {
    const consumptions = data.map(d => d.consumption);
    const mean = ss.mean(consumptions);

    // Pronóstico simple: exponential smoothing con ajuste estacional
    const alpha = 0.3; // Smoothing factor
    let current = mean;

    const forecasts: number[] = [];
    for (let i = 0; i < 12; i++) {
      current = alpha * consumptions[consumptions.length - 1] + (1 - alpha) * current;
      
      // Ajustar por estacionalidad si existe patrón
      let adjustedForecast = current;
      if (seasonality.detected && seasonality.seasonalFactor > 0) {
        // Ejemplo simple: alternar entre picos y valles
        const monthIndex = (new Date().getMonth() + i) % 12;
        const isSummerMonth = [5, 6, 7].includes(monthIndex);
        adjustedForecast = seasonality.pattern === 'summer_peak' && isSummerMonth
          ? current * seasonality.seasonalFactor
          : current / seasonality.seasonalFactor;
      }

      forecasts.push(Math.round(adjustedForecast * 100) / 100);
    }

    // Confianza basada en consistencia de datos
    const stdDev = ss.standardDeviation(consumptions);
    const cv = (stdDev / mean); // Coefficient of variation
    const confidence = Math.max(0.5, Math.min(1, 1 - cv)); // 0.5-1.0

    return {
      nextMonth: forecasts[0],
      next3Months: forecasts.slice(0, 3),
      next12Months: forecasts,
      confidence: Math.round(confidence * 100)
    };
  }

  /**
   * Detectar anomalías en consumo
   */
  private detectAnomalies(
    consumptions: number[],
    statistics: ConsumptionAnalysis['statistics']
  ): ConsumptionAnalysis['anomalies'] {
    const anomalies: ConsumptionAnalysis['anomalies']['points'] = [];
    const threshold = 2.5; // Z-score threshold

    consumptions.forEach((consumption, index) => {
      const zScore = Math.abs((consumption - statistics.mean) / statistics.stdDev);
      if (zScore > threshold) {
        const deviation = Math.round(((consumption - statistics.mean) / statistics.mean) * 100);
        const severity: 'low' | 'medium' | 'high' =
          zScore > 4 ? 'high' :
          zScore > 3 ? 'medium' :
          'low';

        anomalies.push({
          date: new Date(), // Placeholder - idealmente vendría del data
          consumption,
          deviation,
          severity
        });
      }
    });

    return {
      detected: anomalies.length > 0,
      points: anomalies
    };
  }

  /**
   * Generar recomendaciones de ahorro
   */
  private generateRecommendations(
    trends: ConsumptionAnalysis['trends'],
    seasonality: ConsumptionAnalysis['seasonality'],
    statistics: ConsumptionAnalysis['statistics'],
    anomalies: ConsumptionAnalysis['anomalies']
  ): ConsumptionAnalysis['recommendations'] {
    const recommendations: string[] = [];
    let potentialSavings = 0;

    // Basado en tendencia
    if (trends.direction === 'increasing') {
      recommendations.push('Tu consumo está aumentando. Revisa equipos de alto consumo (aire acondicionado, calentador).');
      potentialSavings += 15;
    } else if (trends.direction === 'decreasing') {
      recommendations.push('¡Buen trabajo! Tu consumo está bajando. Mantén los hábitos que funcionan.');
    }

    // Basado en estacionalidad
    if (seasonality.detected) {
      if (seasonality.pattern === 'summer_peak') {
        recommendations.push('Tu consumo sube en verano. Considera aire acondicionado eficiente o sistemas de refrigeración pasiva.');
        potentialSavings += 10;
      } else if (seasonality.pattern === 'winter_peak') {
        recommendations.push('Tu consumo sube en invierno. Revisa calefacción y aislamiento térmico.');
        potentialSavings += 12;
      }
    }

    // Basado en anomalías
    if (anomalies.detected && anomalies.points.length > 0) {
      const highAnomalies = anomalies.points.filter(a => a.severity === 'high');
      if (highAnomalies.length > 0) {
        recommendations.push(`Se detectaron ${highAnomalies.length} picos anormales. Investiga posibles fallas o equipos defectuosos.`);
        potentialSavings += 8;
      }
    }

    // Basado en desviación estándar
    if (statistics.stdDev > statistics.mean * 0.3) {
      recommendations.push('Tu consumo es muy variable. Estabiliza el uso de electrodomésticos para predecibilidad.');
      potentialSavings += 10;
    }

    // Recomendación general de energías renovables
    recommendations.push('Un sistema solar podría reducir tu factura 50-80%. Considera una cotización.');

    return {
      savings: recommendations,
      potentialSavings: Math.min(potentialSavings, 80) // Cap at 80%
    };
  }

  /**
   * Helper: Regresión lineal simple
   */
  private linearRegression(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = ss.sum(x);
    const sumY = ss.sum(y);
    const sumXY = ss.sum(x.map((xi, i) => xi * y[i]));
    const sumX2 = ss.sum(x.map(xi => xi * xi));

    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  /**
   * Helper: Agrupar datos por mes
   */
  private groupByMonth(data: ConsumptionDataPoint[]): number[][] {
    const grouped: { [key: string]: number[] } = {};

    data.forEach(point => {
      const date = new Date(point.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(point.consumption);
    });

    return Object.values(grouped);
  }
}

export default new ConsumptionAnalysisService();
