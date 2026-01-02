// =====================================================
// RUTAS DE PDF
// Endpoints para generación de PDFs
// =====================================================

import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import {
  downloadQuotationPDF,
  viewQuotationPDF,
  saveQuotationPDF,
} from './pdf.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de PDF para cotizaciones
router.get('/quotations/:id/pdf', downloadQuotationPDF);
router.get('/quotations/:id/pdf/view', viewQuotationPDF);
router.post('/quotations/:id/pdf/save', saveQuotationPDF);

export { router as pdfRoutes };
