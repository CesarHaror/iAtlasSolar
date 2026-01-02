// =====================================================
// RUTAS DE CLIENTES
// =====================================================

import { Router } from 'express';
import * as clientController from './client.controller.js';
import { authenticate, authorize } from '../../shared/middleware/index.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/clients/search - Buscar clientes (autocompletado)
router.get('/search', clientController.searchClients);

// GET /api/clients/stats - Estadísticas de clientes
router.get('/stats', clientController.getClientStats);

// GET /api/clients - Listar todos los clientes
router.get('/', clientController.getClients);

// POST /api/clients - Crear nuevo cliente
router.post('/', authorize('VENDEDOR', 'ADMIN'), clientController.createClient);

// GET /api/clients/:id - Obtener cliente por ID
router.get('/:id', clientController.getClientById);

// PUT /api/clients/:id - Actualizar cliente
router.put('/:id', authorize('VENDEDOR', 'ADMIN'), clientController.updateClient);

// DELETE /api/clients/:id - Eliminar cliente
router.delete('/:id', authorize('ADMIN'), clientController.deleteClient);

export default router;
