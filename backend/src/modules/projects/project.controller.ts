import { Request, Response, NextFunction } from 'express';
import * as projectService from './project.service';
import { 
  createProjectSchema,
  updateProjectSchema,
  listProjectsSchema,
  registerPaymentSchema,
  updatePaymentSchema,
} from './project.schema';
import { logger } from '../../shared/utils/logger';

// =====================================================
// PROJECT CONTROLLER
// =====================================================

// Crear proyecto desde proforma firmada
export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createProjectSchema.parse(req.body);
    const project = await projectService.createProject(input);
    
    logger.info(`Proyecto creado: ${project?.projectNumber}`, {
      projectId: project?.id,
      proformaId: input.proformaId,
      userId: req.user?.userId,
    });
    
    res.status(201).json({
      success: true,
      message: 'Proyecto creado exitosamente',
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener proyecto por ID
export async function getProjectById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const project = await projectService.getProjectById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado',
      });
    }
    
    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

// Listar proyectos
export async function listProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const input = listProjectsSchema.parse(req.query);
    const result = await projectService.listProjects(input);
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar proyecto
export async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const input = updateProjectSchema.parse(req.body);
    const project = await projectService.updateProject(id, input);
    
    logger.info(`Proyecto actualizado: ${project.projectNumber}`, {
      projectId: project.id,
      userId: req.user?.userId,
    });
    
    res.json({
      success: true,
      message: 'Proyecto actualizado exitosamente',
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

// Cambiar estado del proyecto
export async function changeStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const project = await projectService.changeProjectStatus(id, status, notes);
    
    logger.info(`Estado del proyecto cambiado: ${project.projectNumber} -> ${status}`, {
      projectId: project.id,
      status,
      userId: req.user?.userId,
    });
    
    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

// Registrar pago
export async function registerPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerPaymentSchema.parse({
      ...req.body,
      projectId: req.params.id,
    });
    
    const result = await projectService.registerPayment(input);
    
    logger.info(`Pago registrado: ${input.phase} - $${input.amount}`, {
      projectId: input.projectId,
      paymentId: result.payment.id,
      phase: input.phase,
      amount: input.amount,
      userId: req.user?.userId,
    });
    
    res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener pagos de un proyecto
export async function getPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const payments = await projectService.getProjectPayments(id);
    
    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
}

// Actualizar pago
export async function updatePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { paymentId } = req.params;
    const input = updatePaymentSchema.parse(req.body);
    const payment = await projectService.updatePayment(paymentId, input);
    
    logger.info(`Pago actualizado: ${paymentId}`, {
      paymentId,
      userId: req.user?.userId,
    });
    
    res.json({
      success: true,
      message: 'Pago actualizado exitosamente',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener estadísticas
export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await projectService.getProjectStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
