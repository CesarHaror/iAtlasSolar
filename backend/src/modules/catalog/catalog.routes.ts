// =====================================================
// RUTAS DE CATÁLOGO
// =====================================================

import { Router } from 'express';
import * as catalogController from './catalog.controller.js';
import { authenticate, authorize } from '../../shared/middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// =====================================================
// ESTADÍSTICAS
// =====================================================

router.get('/stats', catalogController.getCatalogStats);

// =====================================================
// PANELES
// =====================================================

router.get('/panels', catalogController.getPanels);
router.get('/panels/:id', catalogController.getPanelById);
router.post('/panels', authorize('ADMIN'), catalogController.createPanel);
router.put('/panels/:id', authorize('ADMIN'), catalogController.updatePanel);
router.delete('/panels/:id', authorize('ADMIN'), catalogController.deletePanel);

// =====================================================
// INVERSORES
// =====================================================

router.get('/inverters', catalogController.getInverters);
router.get('/inverters/:id', catalogController.getInverterById);
router.post('/inverters', authorize('ADMIN'), catalogController.createInverter);
router.put('/inverters/:id', authorize('ADMIN'), catalogController.updateInverter);
router.delete('/inverters/:id', authorize('ADMIN'), catalogController.deleteInverter);

// =====================================================
// CIUDADES HSP
// =====================================================

router.get('/cities', catalogController.getCitiesHSP);
router.get('/cities/:id', catalogController.getCityHSPById);
router.post('/cities', authorize('ADMIN'), catalogController.createCityHSP);
router.put('/cities/:id', authorize('ADMIN'), catalogController.updateCityHSP);
router.delete('/cities/:id', authorize('ADMIN'), catalogController.deleteCityHSP);

export default router;
