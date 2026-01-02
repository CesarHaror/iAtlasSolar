// =====================================================
// SCHEMAS DE VALIDACIÓN - COTIZACIONES
// =====================================================

import { z } from 'zod';

// Schema para cálculo rápido (sin guardar)
export const calculateQuotationSchema = z.object({
  // Datos de consumo
  monthlyKwh: z.number().min(50, 'El consumo mínimo es 50 kWh').max(50000, 'El consumo máximo es 50,000 kWh'),
  bimonthlyBill: z.number().optional(),
  cfeTariff: z.string().min(1, 'La tarifa CFE es requerida'),
  
  // Ubicación
  city: z.string().min(2, 'La ciudad es requerida'),
  state: z.string().optional(),
  customHSP: z.number().min(3).max(8).optional(),
  
  // Configuración del sistema
  panelId: z.string().optional(),
  inverterId: z.string().optional(),
  installationType: z.enum(['ROOF', 'GROUND', 'CARPORT']).default('ROOF'),
  systemLosses: z.number().min(0.05).max(0.30).optional(),
  marginPercentage: z.number().min(0).max(0.50).optional(),
});

// Schema para crear cotización (guardar en BD)
export const createQuotationSchema = z.object({
  clientId: z.string().min(1, 'ID de cliente requerido'),
  
  // Datos de consumo
  monthlyKwh: z.number().min(50).max(50000),
  bimonthlyBill: z.number().optional(),
  cfeTariff: z.string().min(1),
  
  // Ubicación
  city: z.string().min(2),
  state: z.string().optional(),
  
  // Configuración del sistema
  panelId: z.string().optional(),
  inverterId: z.string().optional(),
  installationType: z.enum(['ROOF', 'GROUND', 'CARPORT']).default('ROOF'),
  
  // Datos calculados (se recalculan en el servidor)
  systemSizeKwp: z.number().optional(),
  numberOfPanels: z.number().optional(),
  numberOfInverters: z.number().optional(),
  
  // Precios (pueden ser ajustados manualmente)
  panelsCost: z.number().optional(),
  invertersCost: z.number().optional(),
  installationCost: z.number().optional(),
  additionalCosts: z.number().optional(),
  discount: z.number().min(0).max(100).optional(), // Porcentaje de descuento
  
  // Notas
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  
  // Validez
  validUntil: z.string().optional(),
});

// Schema para actualizar cotización
export const updateQuotationSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),

  // Campos de consumo y sistema
  monthlyConsumption: z.number().optional(),
  avgBill: z.number().optional(),
  tariff: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  panelId: z.string().optional(),
  panelsQty: z.number().optional(),
  systemSize: z.number().optional(),
  monthlyProduction: z.number().optional(),
  annualProduction: z.number().optional(),

  // Precios ajustables
  panelsCost: z.number().optional(),
  invertersCost: z.number().optional(),
  installationCost: z.number().optional(),
  additionalCosts: z.number().optional(),
  discount: z.number().min(0).max(100).optional(),

  // Notas
  notes: z.string().optional(),
  internalNotes: z.string().optional(),

  // Validez
  validUntil: z.string().optional(),

  // Otros campos de resultado/calculo
  realCost: z.number().optional(),
  salePrice: z.number().optional(),
  monthlySavings: z.number().optional(),
  monthlyBillAfter: z.number().optional(),
  annualSavings: z.number().optional(),
  paybackYears: z.number().optional(),
  roi25Years: z.number().optional(),
});

// Schema para filtros de búsqueda
export const queryQuotationsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
  clientId: z.string().optional(),
  createdById: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  sortBy: z.enum(['createdAt', 'totalPrice', 'systemSize', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CalculateQuotationInput = z.infer<typeof calculateQuotationSchema>;
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
export type QueryQuotationsInput = z.infer<typeof queryQuotationsSchema>;
