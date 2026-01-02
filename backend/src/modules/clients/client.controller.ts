// =====================================================
// CONTROLADOR DE CLIENTES
// =====================================================

import { Request, Response } from 'express';
import * as clientService from './client.service.js';
import { 
  createClientSchema, 
  updateClientSchema,
  queryClientsSchema,
} from './client.schema.js';
import { asyncHandler } from '../../shared/middleware/index.js';

/**
 * POST /api/clients
 * Crear nuevo cliente
 */
export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createClientSchema.parse(req.body);
  const client = await clientService.createClient(validatedData);

  res.status(201).json({
    success: true,
    message: 'Cliente creado exitosamente',
    data: client,
  });
});

/**
 * GET /api/clients
 * Obtener todos los clientes con paginación y filtros
 */
export const getClients = asyncHandler(async (req: Request, res: Response) => {
  const query = queryClientsSchema.parse(req.query);
  const result = await clientService.getClients(query);

  res.json({
    success: true,
    data: result.clients,
    pagination: result.pagination,
  });
});

/**
 * GET /api/clients/search
 * Buscar clientes (para autocompletado)
 */
export const searchClients = asyncHandler(async (req: Request, res: Response) => {
  const search = (req.query.q as string) || '';
  const limit = parseInt(req.query.limit as string) || 10;
  
  const clients = await clientService.searchClients(search, limit);

  res.json({
    success: true,
    data: clients,
  });
});

/**
 * GET /api/clients/stats
 * Obtener estadísticas de clientes
 */
export const getClientStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await clientService.getClientStats();

  res.json({
    success: true,
    data: stats,
  });
});

/**
 * GET /api/clients/:id
 * Obtener cliente por ID
 */
export const getClientById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const client = await clientService.getClientById(id);

  res.json({
    success: true,
    data: client,
  });
});

/**
 * PUT /api/clients/:id
 * Actualizar cliente
 */
export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateClientSchema.parse(req.body);
  const client = await clientService.updateClient(id, validatedData);

  res.json({
    success: true,
    message: 'Cliente actualizado exitosamente',
    data: client,
  });
});

/**
 * DELETE /api/clients/:id
 * Eliminar cliente
 */
export const deleteClient = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await clientService.deleteClient(id);

  res.json({
    success: true,
    message: 'Cliente eliminado exitosamente',
  });
});
