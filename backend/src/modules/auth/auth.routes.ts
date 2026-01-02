// =====================================================
// RUTAS DE AUTENTICACIÓN
// =====================================================

import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from '../../shared/middleware/index.js';

const router = Router();

// =====================================================
// RUTAS PÚBLICAS
// =====================================================

// POST /api/auth/login - Iniciar sesión
router.post('/login', authController.login);

// =====================================================
// RUTAS PROTEGIDAS
// =====================================================

// POST /api/auth/register - Registrar usuario (requiere auth, idealmente solo admin)
router.post('/register', authenticate, authController.register);

// GET /api/auth/profile - Obtener perfil
router.get('/profile', authenticate, authController.getProfile);

// PUT /api/auth/profile - Actualizar perfil
router.put('/profile', authenticate, authController.updateProfile);

// PUT /api/auth/change-password - Cambiar contraseña
router.put('/change-password', authenticate, authController.changePassword);

// POST /api/auth/verify - Verificar token
router.post('/verify', authenticate, authController.verifyAuth);

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', authenticate, authController.logout);

export default router;
