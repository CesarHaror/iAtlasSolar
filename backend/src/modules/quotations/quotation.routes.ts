// =====================================================
// RUTAS DE COTIZACIONES
// =====================================================

import { Router } from 'express';
import * as quotationController from './quotation.controller';
import { authenticate, authorize } from '../../shared/middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// =====================================================
// CATÁLOGOS (Públicos para usuarios autenticados)
// =====================================================

// GET /api/quotations/panels - Obtener catálogo de paneles
router.get('/panels', quotationController.getPanels);

// GET /api/quotations/inverters - Obtener catálogo de inversores
router.get('/inverters', quotationController.getInverters);

// GET /api/quotations/cities - Obtener ciudades con HSP
router.get('/cities', quotationController.getCities);

// GET /api/quotations/config - Obtener configuración del sistema
router.get('/config', quotationController.getConfig);

// =====================================================
// CALCULADORA
// =====================================================

// POST /api/quotations/calculate - Calcular sin guardar
router.post('/calculate', quotationController.calculate);

// =====================================================
// ESTADÍSTICAS
// =====================================================

// GET /api/quotations/stats - Obtener estadísticas
router.get('/stats', quotationController.stats);

// =====================================================
// CRUD DE COTIZACIONES
// =====================================================

// GET /api/quotations - Listar cotizaciones
router.get('/', quotationController.list);

// POST /api/quotations - Crear cotización
router.post('/', quotationController.create);

// GET /api/quotations/:id - Obtener cotización por ID
router.get('/:id', quotationController.getById);

// PUT /api/quotations/:id - Actualizar cotización
router.put('/:id', quotationController.update);

// DELETE /api/quotations/:id - Eliminar cotización (solo admin)
router.delete('/:id', authorize('ADMIN'), quotationController.remove);

// POST /api/quotations/:id/duplicate - Duplicar cotización
router.post('/:id/duplicate', quotationController.duplicate);

export default router;
