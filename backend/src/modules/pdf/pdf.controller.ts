// =====================================================
// CONTROLADOR DE PDF
// Endpoints para generación de PDFs
// =====================================================

import { Request, Response, NextFunction } from 'express';
import { generateQuotationPDF, savePDFToDisk } from './pdf.service';
import { AppError } from '../../shared/errors/AppError';

/**
 * Generar y descargar PDF de cotización
 * GET /api/quotations/:id/pdf
 */
export async function downloadQuotationPDF(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    
    if (!id) {
      throw new AppError(400, 'ID de cotización requerido');
    }
    
    const { buffer, filename } = await generateQuotationPDF(id);
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    // Enviar el PDF
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

/**
 * Ver PDF de cotización en el navegador
 * GET /api/quotations/:id/pdf/view
 */
export async function viewQuotationPDF(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    
    if (!id) {
      throw new AppError(400, 'ID de cotización requerido');
    }
    
    const { buffer, filename } = await generateQuotationPDF(id);
    
    // Configurar headers para visualización inline
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    // Enviar el PDF
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

/**
 * Guardar PDF en disco y devolver URL
 * POST /api/quotations/:id/pdf/save
 */
export async function saveQuotationPDF(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    
    if (!id) {
      throw new AppError(400, 'ID de cotización requerido');
    }
    
    const pdfUrl = await savePDFToDisk(id);
    
    res.status(200).json({
      success: true,
      message: 'PDF guardado exitosamente',
      data: { pdfUrl },
    });
  } catch (error) {
    next(error);
  }
}
