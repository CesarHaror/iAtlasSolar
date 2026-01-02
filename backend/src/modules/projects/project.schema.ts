import { z } from 'zod';

// =====================================================
// SCHEMAS DE PROYECTO
// =====================================================

// Schema para crear proyecto desde proforma firmada
export const createProjectSchema = z.object({
  proformaId: z.string().min(1, 'El ID de proforma es requerido'),
  assignedToId: z.string().optional(),
  estimatedEndDate: z.string().datetime().optional(),
  installationAddress: z.string().optional(),
  notes: z.string().optional(),
});

// Schema para actualizar proyecto
export const updateProjectSchema = z.object({
  status: z.enum(['PENDING_PAYMENT', 'IN_PROGRESS', 'CFE_PROCESS', 'COMPLETED', 'CANCELLED']).optional(),
  assignedToId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  estimatedEndDate: z.string().datetime().optional(),
  actualEndDate: z.string().datetime().optional(),
  cfeApprovalDate: z.string().datetime().optional(),
  interconnectionDate: z.string().datetime().optional(),
  installationAddress: z.string().optional(),
  notes: z.string().optional(),
  documents: z.array(z.string()).optional(),
});

// Schema para listar proyectos
export const listProjectsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(['PENDING_PAYMENT', 'IN_PROGRESS', 'CFE_PROCESS', 'COMPLETED', 'CANCELLED']).optional(),
  clientId: z.string().optional(),
  assignedToId: z.string().optional(),
  search: z.string().optional(),
});

// Schema para registrar pago
export const registerPaymentSchema = z.object({
  projectId: z.string().min(1, 'El ID del proyecto es requerido'),
  phase: z.enum(['ANTICIPO', 'MATERIALES', 'FINIQUITO']),
  amount: z.number().positive('El monto debe ser positivo'),
  paymentMethod: z.string().min(1, 'El método de pago es requerido'),
  reference: z.string().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
});

// Schema para actualizar pago
export const updatePaymentSchema = z.object({
  paidAmount: z.number().positive().optional(),
  status: z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE']).optional(),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
  paidAt: z.string().datetime().optional(),
});

// Types
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsInput = z.infer<typeof listProjectsSchema>;
export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
