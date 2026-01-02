// =====================================================
// SCHEMAS DE VALIDACIÓN - CLIENTES
// =====================================================

import { z } from 'zod';
import { CFETariff } from '@prisma/client';

// Schema para crear cliente
export const createClientSchema = z.object({
  // Datos personales
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es muy largo'),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  phone: z
    .string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos'),
  rfc: z
    .string()
    .optional(),

  // Dirección
  address: z
    .string()
    .min(1, 'La dirección es requerida'),
  city: z
    .string()
    .min(2, 'La ciudad es requerida'),
  state: z
    .string()
    .optional(),
  postalCode: z
    .string()
    .optional(),

  // Ubicación (opcional, para cálculos de irradiancia)
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  // Datos CFE
  cfeServiceNumber: z
    .string()
    .optional(),
  cfeTariff: z
    .nativeEnum(CFETariff)
    .optional(),

  // Metadata
  notes: z.string().optional(),
  source: z.string().optional(),
});

// Schema para actualizar cliente (todos los campos opcionales)
export const updateClientSchema = createClientSchema.partial();

// Schema para buscar/filtrar clientes
export const queryClientsSchema = z.object({
  search: z.string().optional(),
  city: z.string().optional(),
  tariff: z.nativeEnum(CFETariff).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'email', 'city', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Tipos inferidos
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type QueryClientsInput = z.infer<typeof queryClientsSchema>;
