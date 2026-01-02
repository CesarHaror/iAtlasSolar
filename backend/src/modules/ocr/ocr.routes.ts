// =====================================================
// RUTAS OCR - ANÁLISIS DE RECIBOS CFE
// =====================================================

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../../shared/middleware/auth.js';
import {
  analyzeReceipt,
  analyzeReceiptBase64,
  getOCRStatus,
} from './ocr.controller.js';

const router = Router();

// Configuración de multer para subida de PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/receipts');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `receipt-${uniqueSuffix}.pdf`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Solo aceptar archivos PDF
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se aceptan archivos PDF'));
    }
  },
});

// Rutas protegidas (requieren autenticación)
router.use(authenticate);

// Estado del servicio OCR
router.get('/status', getOCRStatus);

// Analizar recibo desde archivo
router.post('/analyze-receipt', upload.single('receipt'), analyzeReceipt);

// Analizar recibo desde base64
router.post('/analyze-receipt-base64', analyzeReceiptBase64);

export default router;
