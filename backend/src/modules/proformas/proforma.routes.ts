import { Router } from 'express';
import * as proformaController from './proforma.controller';
import { authenticate, authorize } from '../../shared/middleware/auth';

const router = Router();

// =====================================================
// PROFORMA ROUTES
// =====================================================

// Todas las rutas requieren autenticación
router.use(authenticate);

// Estadísticas (solo admin)
router.get('/stats', authorize('ADMIN'), proformaController.getStats);

// CRUD
router.get('/', proformaController.listProformas);
router.get('/:id', proformaController.getProformaById);
router.post('/', proformaController.createProforma);
router.put('/:id', proformaController.updateProforma);

// Acciones
router.post('/:id/send', proformaController.sendProforma);
router.post('/:id/sign', proformaController.signProforma);
router.post('/:id/cancel', authorize('ADMIN'), proformaController.cancelProforma);

// Ruta pública para marcar como vista (cuando el cliente abre el link)
// TODO: Implementar token de acceso público
router.post('/:id/viewed', proformaController.markAsViewed);

export default router;
