// =====================================================
// SCHEMAS DE VALIDACIÓN - CATÁLOGO
// =====================================================

import { z } from 'zod';

// =====================================================
// PANELES
// =====================================================

export const createPanelSchema = z.object({
  brand: z.string().min(1, 'Marca requerida'),
  model: z.string().min(1, 'Modelo requerido'),
  power: z.number().min(100, 'Potencia mínima 100W').max(1000, 'Potencia máxima 1000W'),
  efficiency: z.number().min(10, 'Eficiencia mínima 10%').max(30, 'Eficiencia máxima 30%'),
  warranty: z.number().min(1, 'Garantía mínima 1 año').max(50, 'Garantía máxima 50 años'),
  price: z.number().min(0, 'Precio debe ser positivo'),
  isActive: z.boolean().optional().default(true),
});

export const updatePanelSchema = createPanelSchema.partial();

// =====================================================
// INVERSORES
// =====================================================

export const createInverterSchema = z.object({
  brand: z.string().min(1, 'Marca requerida'),
  model: z.string().min(1, 'Modelo requerido'),
  power: z.number().min(0.5, 'Potencia mínima 0.5kW').max(100, 'Potencia máxima 100kW'),
  phases: z.number().min(1).max(3),
  warranty: z.number().min(1, 'Garantía mínima 1 año').max(30, 'Garantía máxima 30 años'),
  price: z.number().min(0, 'Precio debe ser positivo'),
  isActive: z.boolean().optional().default(true),
});

export const updateInverterSchema = createInverterSchema.partial();

// =====================================================
// CIUDADES HSP
// =====================================================

export const createCityHSPSchema = z.object({
  city: z.string().min(1, 'Ciudad requerida'),
  state: z.string().min(1, 'Estado requerido'),
  hsp: z.number().min(1, 'HSP mínimo 1').max(10, 'HSP máximo 10'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const updateCityHSPSchema = createCityHSPSchema.partial();

// Types
export type CreatePanelInput = z.infer<typeof createPanelSchema>;
export type UpdatePanelInput = z.infer<typeof updatePanelSchema>;
export type CreateInverterInput = z.infer<typeof createInverterSchema>;
export type UpdateInverterInput = z.infer<typeof updateInverterSchema>;
export type CreateCityHSPInput = z.infer<typeof createCityHSPSchema>;
export type UpdateCityHSPInput = z.infer<typeof updateCityHSPSchema>;
