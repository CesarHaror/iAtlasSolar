import { z } from 'zod';

// ===============================================
// SCHEMAS PARA OCR
// ===============================================

export const ocrAnalyzeSchema = z.object({
  file: z.any().refine((file) => file, 'File es requerido'),
});

export const ocrAnalyzeBase64Schema = z.object({
  base64: z.string().min(100, 'Base64 inválido o vacío'),
  fileName: z.string().optional(),
});

// ===============================================
// SCHEMAS PARA AUTH
// ===============================================

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  company: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Token inválido'),
});

// ===============================================
// SCHEMAS PARA QUOTACIONES
// ===============================================

export const createQuotationSchema = z.object({
  clientId: z.string().uuid('Client ID inválido'),
  systemSize: z.number().positive('System size debe ser mayor a 0'),
  panelCount: z.number().int().positive('Panel count debe ser positivo'),
  monthlyConsumption: z.number().positive('Consumo mensual debe ser mayor a 0'),
  tariffType: z.enum(['T1', 'GDMTO', 'GDMTH', 'DAC', 'OTRO']),
  investmentAmount: z.number().positive('Monto de inversión debe ser mayor a 0'),
  estimatedMonthlySavings: z.number().nonnegative('Ahorros mensuales no puede ser negativo'),
  paybackMonths: z.number().positive('Payback debe ser mayor a 0').optional(),
  roi25Years: z.number().nonnegative('ROI no puede ser negativo').optional(),
  notes: z.string().max(2000, 'Notas no pueden exceder 2000 caracteres').optional(),
});

export const updateQuotationSchema = createQuotationSchema.partial();

export const quotationFilterSchema = z.object({
  clientId: z.string().uuid().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// ===============================================
// SCHEMAS PARA CLIENTES
// ===============================================

export const createClientSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  serviceNumber: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

// ===============================================
// HELPERS
// ===============================================

export const validateSchema = async <T>(schema: z.ZodSchema, data: unknown): Promise<T> => {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw {
        statusCode: 400,
        message: 'Validación fallida',
        details: error.errors,
      };
    }
    throw error;
  }
};
