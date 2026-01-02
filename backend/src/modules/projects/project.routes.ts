import { Router } from 'express';
import * as projectController from './project.controller';
import { authenticate, authorize } from '../../shared/middleware/auth';

const router = Router();

// =====================================================
// PROJECT ROUTES
// =====================================================

// Todas las rutas requieren autenticación
router.use(authenticate);

// Estadísticas (solo admin)
router.get('/stats', authorize('ADMIN'), projectController.getStats);

// CRUD
router.get('/', projectController.listProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);

// Acciones
router.post('/:id/status', projectController.changeStatus);

// Pagos
router.get('/:id/payments', projectController.getPayments);
router.post('/:id/payments', projectController.registerPayment);
router.put('/payments/:paymentId', projectController.updatePayment);

export default router;
