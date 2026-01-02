import { Request, Response, NextFunction } from 'express';
import * as proformaService from './proforma.service';
import { 
  createProformaSchema,
  updateProformaSchema,
  signProformaSchema,
  listProformasSchema,
} from './proforma.schema';
import { logger } from '../../shared/utils/logger';

// =====================================================
// PROFORMA CONTROLLER
// =====================================================

// Crear proforma desde cotización aprobada
export async function createProforma(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createProformaSchema.parse(req.body);
    const proforma = await proformaService.createProforma(input);
    
    logger.info(`Proforma creada: ${proforma.proformaNumber}`, {
      proformaId: proforma.id,
      quotationId: input.quotationId,
      userId: req.user?.userId,
    });
    
    res.status(201).json({
      success: true,
      message: 'Proforma creada exitosamente',
      data: proforma,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener proforma por ID
export async function getProformaById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const proforma = await proformaService.getProformaById(id);
    
    if (!proforma) {
      return res.status(404).json({
        success: false,
        message: 'Proforma no encontrada',
      });
    }
    
    res.json({
      success: true,
      data: proforma,
    });
  } catch (error) {
    next(error);
  }
}

// Listar proformas
export async function listProformas(req: Request, res: Response, next: NextFunction) {
  try {
    const input = listProformasSchema.parse(req.query);
    const result = await proformaService.listProformas(input);
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar proforma
export async function updateProforma(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const input = updateProformaSchema.parse(req.body);
    const proforma = await proformaService.updateProforma(id, input);
    
    logger.info(`Proforma actualizada: ${proforma.proformaNumber}`, {
      proformaId: proforma.id,
      userId: req.user?.userId,
    });
    
    res.json({
      success: true,
      message: 'Proforma actualizada exitosamente',
      data: proforma,
    });
  } catch (error) {
    next(error);
  }
}

// Enviar proforma
export async function sendProforma(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const proforma = await proformaService.sendProforma(id);
    
    logger.info(`Proforma enviada: ${proforma.proformaNumber}`, {
      proformaId: proforma.id,
      userId: req.user?.userId,
    });
    
    res.json({
      success: true,
      message: 'Proforma enviada exitosamente',
      data: proforma,
    });
  } catch (error) {
    next(error);
  }
}

// Marcar como vista
export async function markAsViewed(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const proforma = await proformaService.markProformaAsViewed(id);
    
    res.json({
      success: true,
      data: proforma,
    });
  } catch (error) {
    next(error);
  }
}

// Firmar proforma
export async function signProforma(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const input = signProformaSchema.parse(req.body);
    const proforma = await proformaService.signProforma(id, input);
    
    logger.info(`Proforma firmada: ${proforma.proformaNumber}`, {
      proformaId: proforma.id,
      signedBy: input.signedByName,
    });
    
    res.json({
      success: true,
      message: 'Proforma firmada exitosamente',
      data: proforma,
    });
  } catch (error) {
    next(error);
  }
}

// Cancelar proforma
export async function cancelProforma(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const proforma = await proformaService.cancelProforma(id, reason);
    
    logger.info(`Proforma cancelada: ${id}`, {
      proformaId: id,
      reason,
      userId: req.user?.userId,
    });
    
    res.json({
      success: true,
      message: 'Proforma cancelada',
      data: proforma,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener estadísticas
export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await proformaService.getProformaStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
