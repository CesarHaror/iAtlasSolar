// =====================================================
// CONTROLADOR OCR - ANÁLISIS DE RECIBOS CFE
// =====================================================

import { Request, Response, NextFunction } from 'express';
import { getCFEAnalyzer } from './cfe-ocr.service.js';
import { AppError } from '../../shared/errors/index.js';
import path from 'path';
import fs from 'fs';

/**
 * Analizar recibo CFE desde archivo subido (solo PDF)
 * POST /api/ocr/analyze-receipt
 */
export const analyzeReceipt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const analyzer = getCFEAnalyzer();
    
    // Verificar que el analizador está configurado
    if (!analyzer.isConfigured()) {
      throw new AppError(
        503,
        'El servicio de análisis de recibos no está configurado. Contacta al administrador.'
      );
    }
    
    // Verificar que se subió un archivo
    if (!req.file) {
      throw new AppError(400, 'No se proporcionó el archivo PDF del recibo');
    }
    
    const pdfPath = req.file.path;
    
    // Verificar extensión válida (solo PDF)
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== '.pdf') {
      // Eliminar archivo inválido
      fs.unlinkSync(pdfPath);
      throw new AppError(
        400,
        'Formato no válido. Solo se aceptan archivos PDF'
      );
    }
    
    // Analizar recibo
    console.log(`📄 Analizando recibo CFE: ${req.file.originalname}`);
    const result = await analyzer.analyzeReceipt(pdfPath);
    
    // Eliminar archivo después de analizar
    fs.unlinkSync(pdfPath);
    
    console.log(`✅ Recibo analizado con ${result.confidence}% de confianza`);
    
    res.json({
      success: true,
      data: result,
      message: `Recibo analizado exitosamente (${result.confidence}% confianza)`,
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Analizar recibo CFE desde base64
 * POST /api/ocr/analyze-receipt-base64
 */
export const analyzeReceiptBase64 = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const analyzer = getCFEAnalyzer();
    
    if (!analyzer.isConfigured()) {
      throw new AppError(
        503,
        'El servicio de análisis de recibos no está configurado. Contacta al administrador.'
      );
    }
    
    const { image, mimeType } = req.body;
    
    if (!image) {
      throw new AppError(400, 'No se proporcionó la imagen en base64');
    }
    
    // Validar que es base64 válido
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, '');
    
    if (!base64Regex.test(cleanBase64)) {
      throw new AppError(400, 'El formato base64 no es válido');
    }
    
    console.log(`📄 Analizando recibo CFE desde base64...`);
    const result = await analyzer.analyzeReceipt(cleanBase64, true);
    
    console.log(`✅ Recibo analizado con ${result.confidence}% de confianza`);
    
    res.json({
      success: true,
      data: result,
      message: `Recibo analizado exitosamente (${result.confidence}% confianza)`,
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Verificar estado del servicio OCR
 * GET /api/ocr/status
 */
export const getOCRStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const analyzer = getCFEAnalyzer();
    const isConfigured = analyzer.isConfigured();
    
    res.json({
      success: true,
      data: {
        available: isConfigured,
        provider: isConfigured ? 'PDF Parser (gratuito)' : null,
        message: isConfigured 
          ? 'Servicio de análisis de recibos CFE disponible'
          : 'Error al inicializar el servicio de análisis',
      },
    });
    
  } catch (error) {
    next(error);
  }
};
