import { z } from 'zod';

// =====================================================
// SCHEMAS DE PROFORMA (PREFACTURA)
// =====================================================

// Schema de plan de pago individual
export const paymentPlanItemSchema = z.object({
  phase: z.enum(['ANTICIPO', 'MATERIALES', 'FINIQUITO']),
  label: z.string(),
  percent: z.number().min(0).max(100),
  amount: z.number().min(0),
});

// Schema para crear proforma desde cotización aprobada
export const createProformaSchema = z.object({
  quotationId: z.string().min(1, 'El ID de cotización es requerido'),
  paymentPlan: z.array(paymentPlanItemSchema).optional(),
  termsConditions: z.string().optional(),
  notes: z.string().optional(),
  validUntil: z.string().datetime().optional(),
});

// Schema para actualizar proforma
export const updateProformaSchema = z.object({
  paymentPlan: z.array(paymentPlanItemSchema).optional(),
  termsConditions: z.string().optional(),
  notes: z.string().optional(),
  validUntil: z.string().datetime().optional(),
});

// Schema para firmar proforma
export const signProformaSchema = z.object({
  signatureImage: z.string().min(1, 'La firma es requerida'),
  signedByName: z.string().min(2, 'El nombre del firmante es requerido'),
  signedByEmail: z.string().email('Email inválido'),
});

// Schema para listar proformas
export const listProformasSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(['DRAFT', 'SENT', 'PENDING_SIGNATURE', 'SIGNED', 'CANCELLED']).optional(),
  clientId: z.string().optional(),
  search: z.string().optional(),
});

// Types
export type PaymentPlanItem = z.infer<typeof paymentPlanItemSchema>;
export type CreateProformaInput = z.infer<typeof createProformaSchema>;
export type UpdateProformaInput = z.infer<typeof updateProformaSchema>;
export type SignProformaInput = z.infer<typeof signProformaSchema>;
export type ListProformasInput = z.infer<typeof listProformasSchema>;
