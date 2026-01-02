// =====================================================
// RUTAS DE CONFIGURACIÓN
// =====================================================

import { Router } from 'express';
import * as configController from './config.controller.js';
import { authenticate, authorize } from '../../shared/middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación y ser admin
router.use(authenticate);
router.use(authorize('ADMIN'));

// Obtener configuraciones
router.get('/', configController.getAllConfigs);
router.get('/grouped', configController.getConfigsGrouped);
router.get('/:key', configController.getConfig);

// Modificar configuraciones
router.post('/', configController.setConfig);
router.post('/bulk', configController.setConfigs);
router.post('/initialize', configController.initializeDefaults);

// Eliminar configuración
router.delete('/:key', configController.deleteConfig);

export default router;
