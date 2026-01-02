// =====================================================
// CONTROLADOR DE COTIZACIONES
// =====================================================

import { Request, Response, NextFunction } from 'express';
import * as quotationService from './quotation.service';
import * as calculatorService from '../calculator/solar-calculator.service';
import {
  calculateQuotationSchema,
  createQuotationSchema,
  updateQuotationSchema,
  queryQuotationsSchema,
} from './quotation.schema';
import { AppError } from '../../shared/errors/AppError';

// Wrapper para manejar errores async
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// =====================================================
// CALCULAR (SIN GUARDAR)
// =====================================================

export const calculate = asyncHandler(async (req: Request, res: Response) => {
  const validated = calculateQuotationSchema.parse(req.body);
  const result = await quotationService.calculateQuotation(validated);
  
  res.json({
    success: true,
    data: result,
  });
});

// =====================================================
// CREAR COTIZACIÓN
// =====================================================

export const create = asyncHandler(async (req: Request, res: Response) => {
  const validated = createQuotationSchema.parse(req.body);
  const userId = req.user!.userId;
  
  const quotation = await quotationService.createQuotation(validated, userId);
  
  res.status(201).json({
    success: true,
    data: quotation,
    message: 'Cotización creada correctamente',
  });
});

// =====================================================
// LISTAR COTIZACIONES
// =====================================================

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = queryQuotationsSchema.parse(req.query);
  
  // Si el usuario es vendedor, solo ver sus cotizaciones
  if (req.user!.role === 'VENDEDOR') {
    query.createdById = req.user!.userId;
  }
  
  const result = await quotationService.getQuotations(query);
  
  res.json({
    success: true,
    ...result,
  });
});

// =====================================================
// OBTENER COTIZACIÓN POR ID
// =====================================================

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const quotation = await quotationService.getQuotationById(id);
  
  // Verificar acceso si es vendedor
  if (req.user!.role === 'VENDEDOR' && quotation.createdById !== req.user!.userId) {
    throw new AppError(403, 'No tienes acceso a esta cotización');
  }
  
  res.json({
    success: true,
    data: quotation,
  });
});

// =====================================================
// ACTUALIZAR COTIZACIÓN
// =====================================================

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validated = updateQuotationSchema.parse(req.body);
  
  // Verificar acceso
  const existing = await quotationService.getQuotationById(id);
  if (req.user!.role === 'VENDEDOR' && existing.createdById !== req.user!.userId) {
    throw new AppError(403, 'No tienes acceso a esta cotización');
  }
  
  const quotation = await quotationService.updateQuotation(id, validated);
  
  res.json({
    success: true,
    data: quotation,
    message: 'Cotización actualizada correctamente',
  });
});

// =====================================================
// ELIMINAR COTIZACIÓN
// =====================================================

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Verificar acceso
  const existing = await quotationService.getQuotationById(id);
  if (req.user!.role === 'VENDEDOR' && existing.createdById !== req.user!.userId) {
    throw new AppError(403, 'No tienes acceso a esta cotización');
  }
  
  await quotationService.deleteQuotation(id);
  
  res.json({
    success: true,
    message: 'Cotización eliminada correctamente',
  });
});

// =====================================================
// DUPLICAR COTIZACIÓN
// =====================================================

export const duplicate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  
  const quotation = await quotationService.duplicateQuotation(id, userId);
  
  res.status(201).json({
    success: true,
    data: quotation,
    message: 'Cotización duplicada correctamente',
  });
});

// =====================================================
// ESTADÍSTICAS
// =====================================================

export const stats = asyncHandler(async (req: Request, res: Response) => {
  // Si es vendedor, solo sus estadísticas
  const createdById = req.user!.role === 'VENDEDOR' ? req.user!.userId : undefined;
  
  const statistics = await quotationService.getQuotationStats(createdById);
  
  res.json({
    success: true,
    data: statistics,
  });
});

// =====================================================
// CATÁLOGOS (PANELES, INVERSORES, CIUDADES)
// =====================================================

export const getPanels = asyncHandler(async (_req: Request, res: Response) => {
  const panels = await calculatorService.getAvailablePanels();
  
  res.json({
    success: true,
    data: panels,
  });
});

export const getInverters = asyncHandler(async (_req: Request, res: Response) => {
  const inverters = await calculatorService.getAvailableInverters();
  
  res.json({
    success: true,
    data: inverters,
  });
});

export const getCities = asyncHandler(async (_req: Request, res: Response) => {
  const cities = await calculatorService.getCitiesWithHSP();
  
  res.json({
    success: true,
    data: cities,
  });
});

export const getConfig = asyncHandler(async (_req: Request, res: Response) => {
  const config = await calculatorService.getSystemConfig();
  
  res.json({
    success: true,
    data: config,
  });
});
