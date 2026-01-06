/**
 * TESTING DATA GENERATOR
 * 
 * Utilidades para preparar datos de testing:
 * - Crear muestras de recibos CFE
 * - Generar ground truth JSON
 * - Crear datasets de prueba
 */

export interface TestDataSample {
  testId: string;
  fileName: string;
  fileSize: number;
  receiptType: 'domestico' | 'comercial' | 'industrial';
  base64: string; // Contenido del archivo en base64
  groundTruth: {
    serviceNumber: string;
    clientName: string;
    address: string;
    billingPeriod: string;
    issueDate: string;
    dueDate: string;
    consumptionKWh: number;
    rate: string;
    consumption: string;
    currentAmount: number;
    previousReading: number;
    currentReading: number;
    billingDays: number;
    [key: string]: any;
  };
  notes?: string;
}

export interface TestingDataset {
  name: string;
  description: string;
  version: string;
  totalSamples: number;
  createdAt: string;
  samples: TestDataSample[];
}

/**
 * Estructura estándar de un recibo CFE doméstico
 */
export const SAMPLE_CFE_RECEIPT_TEMPLATE = {
  serviceNumber: '123456789012',
  clientName: 'Juan Pérez García',
  address: 'Calle Principal 123, Apartamento 4B, Mexico City, 06500',
  billingPeriod: 'Enero 2024',
  issueDate: '2024-01-25',
  dueDate: '2024-02-10',
  consumptionKWh: 245,
  rate: 'Doméstico',
  consumption: 'Normal',
  currentAmount: 1250.50,
  previousReading: 12345,
  currentReading: 12590,
  billingDays: 30,
  previousAmount: 980.25,
  penalty: 0,
  discount: 0,
  totalDue: 1250.50,
  paymentStatus: 'Pendiente',
  meterSerialNumber: 'CFE-2024-001'
};

/**
 * Ejemplos de datos para testing
 */
export const TESTING_EXAMPLES = {
  domestico_basico: {
    serviceNumber: '123456789012',
    clientName: 'Juan Pérez García',
    address: 'Calle Principal 123, Apartamento 4B',
    billingPeriod: 'Enero 2024',
    issueDate: '2024-01-25',
    dueDate: '2024-02-10',
    consumptionKWh: 245,
    rate: 'Doméstico',
    consumption: 'Normal',
    currentAmount: 1250.50,
    previousReading: 12345,
    currentReading: 12590,
    billingDays: 30
  },

  domestico_alto_consumo: {
    serviceNumber: '987654321098',
    clientName: 'María López Rodríguez',
    address: 'Avenida Reforma 500, Casa 12',
    billingPeriod: 'Diciembre 2023',
    issueDate: '2023-12-20',
    dueDate: '2024-01-05',
    consumptionKWh: 850,
    rate: 'Doméstico Alto Consumo',
    consumption: 'Alto',
    currentAmount: 5320.75,
    previousReading: 11000,
    currentReading: 11850,
    billingDays: 30
  },

  comercial: {
    serviceNumber: '555666777888',
    clientName: 'Comercializadora XYZ S.A. de C.V.',
    address: 'Boulevard Industrial 456, Local 10',
    billingPeriod: 'Enero 2024',
    issueDate: '2024-01-30',
    dueDate: '2024-02-15',
    consumptionKWh: 5420,
    rate: 'Comercial',
    consumption: 'Comercial',
    currentAmount: 18750.25,
    previousReading: 45000,
    currentReading: 50420,
    billingDays: 30
  },

  industrial: {
    serviceNumber: '111222333444',
    clientName: 'Manufactura Industrial SA',
    address: 'Parque Industrial Norte, Nave 5',
    billingPeriod: 'Enero 2024',
    issueDate: '2024-01-31',
    dueDate: '2024-02-20',
    consumptionKWh: 45000,
    rate: 'Industrial',
    consumption: 'Industrial',
    currentAmount: 95000.50,
    previousReading: 100000,
    currentReading: 145000,
    billingDays: 31
  }
};

/**
 * Generar un dataset de testing con n muestras
 */
export function generateTestDataset(
  sampleCount: number,
  options?: { includeVariations?: boolean }
): TestingDataset {
  const samples: TestDataSample[] = [];
  const types: Array<'domestico' | 'comercial' | 'industrial'> = [
    'domestico',
    'comercial',
    'industrial'
  ];

  const baseExamples = [
    TESTING_EXAMPLES.domestico_basico,
    TESTING_EXAMPLES.domestico_alto_consumo,
    TESTING_EXAMPLES.comercial,
    TESTING_EXAMPLES.industrial
  ];

  for (let i = 0; i < sampleCount; i++) {
    const typeIndex = i % types.length;
    const example = baseExamples[typeIndex];
    const type = types[typeIndex];

    // Generar variaciones si está habilitado
    let groundTruth = { ...example };
    if (options?.includeVariations && i > 0) {
      // Variar consumo ±20%
      const variation = 1 + (Math.random() - 0.5) * 0.4;
      const baseConsumption = example.consumptionKWh;
      groundTruth.consumptionKWh = Math.round(baseConsumption * variation);
      groundTruth.currentAmount = Math.round(example.currentAmount * variation * 100) / 100;
      groundTruth.currentReading =
        example.previousReading + groundTruth.consumptionKWh;
    }

    const sample: TestDataSample = {
      testId: `test-sample-${i + 1}`,
      fileName: `cfe_receipt_${type}_${i + 1}.pdf`,
      fileSize: Math.floor(Math.random() * 500) + 100, // 100-600 KB simulado
      receiptType: type,
      base64: '', // En uso real, aquí iría el contenido del archivo
      groundTruth,
      notes: `Sample ${i + 1}: ${type.charAt(0).toUpperCase() + type.slice(1)} receipt`
    };

    samples.push(sample);
  }

  return {
    name: `CFE Testing Dataset - ${sampleCount} Samples`,
    description: `Automatically generated dataset with ${sampleCount} CFE receipt samples for OCR testing`,
    version: '1.0.0',
    totalSamples: sampleCount,
    createdAt: new Date().toISOString(),
    samples
  };
}

/**
 * Crear un JSON listo para testing
 */
export function createTestDatasetJSON(sampleCount: number = 20): string {
  const dataset = generateTestDataset(sampleCount, { includeVariations: true });
  return JSON.stringify(dataset, null, 2);
}

/**
 * Validar estructura de ground truth
 */
export function validateGroundTruthStructure(data: any): {
  valid: boolean;
  errors: string[];
} {
  const requiredFields = [
    'serviceNumber',
    'clientName',
    'billingPeriod',
    'consumptionKWh',
    'currentAmount',
    'previousReading',
    'currentReading'
  ];

  const errors: string[] = [];

  for (const field of requiredFields) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validar tipos
  if (data.consumptionKWh && typeof data.consumptionKWh !== 'number') {
    errors.push('consumptionKWh must be a number');
  }
  if (data.currentAmount && typeof data.currentAmount !== 'number') {
    errors.push('currentAmount must be a number');
  }
  if (data.serviceNumber && typeof data.serviceNumber !== 'string') {
    errors.push('serviceNumber must be a string');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generar CSV para testing
 */
export function generateTestingCSV(sampleCount: number = 20): string {
  const dataset = generateTestDataset(sampleCount);
  const headers = [
    'testId',
    'fileName',
    'receiptType',
    'serviceNumber',
    'clientName',
    'consumptionKWh',
    'currentAmount'
  ];

  let csv = headers.join(',') + '\n';

  for (const sample of dataset.samples) {
    const row = [
      sample.testId,
      sample.fileName,
      sample.receiptType,
      sample.groundTruth.serviceNumber,
      `"${sample.groundTruth.clientName}"`,
      sample.groundTruth.consumptionKWh,
      sample.groundTruth.currentAmount
    ];
    csv += row.join(',') + '\n';
  }

  return csv;
}

/**
 * Ejemplo de uso
 */
export function printExamples(): void {
  console.log('=== Testing Data Examples ===\n');

  console.log('1. Sample Dataset (20 items):');
  const dataset20 = generateTestDataset(20, { includeVariations: true });
  console.log(JSON.stringify(dataset20.samples[0], null, 2));

  console.log('\n2. CSV Export Sample:');
  const csv = generateTestingCSV(5);
  console.log(csv);

  console.log('\n3. Validation Example:');
  const validation = validateGroundTruthStructure(TESTING_EXAMPLES.domestico_basico);
  console.log(JSON.stringify(validation, null, 2));
}

// Exportar como default
export default {
  SAMPLE_CFE_RECEIPT_TEMPLATE,
  TESTING_EXAMPLES,
  generateTestDataset,
  createTestDatasetJSON,
  validateGroundTruthStructure,
  generateTestingCSV,
  printExamples
};
