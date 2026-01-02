// =====================================================
// RUTAS DE UPLOAD
// =====================================================

import { Router } from 'express';
import { upload, uploadImage, deleteImage } from './upload.controller.js';
import { authenticate } from '../../shared/middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Subir imagen
router.post('/image', upload.single('image'), uploadImage);

// Eliminar imagen
router.delete('/image/:filename', deleteImage);

export default router;
