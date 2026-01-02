// =====================================================
// CONTROLADOR DE CONFIGURACIÓN
// =====================================================

import { Request, Response, NextFunction } from 'express';
import * as configService from './config.service.js';
import { logger } from '../../shared/utils/logger.js';

// Obtener todas las configuraciones
export async function getAllConfigs(req: Request, res: Response, next: NextFunction) {
  try {
    const configs = await configService.getAllConfigs();
    
    res.json({
      success: true,
      data: configs,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener configuraciones agrupadas
export async function getConfigsGrouped(req: Request, res: Response, next: NextFunction) {
  try {
    const configs = await configService.getConfigsGrouped();
    
    res.json({
      success: true,
      data: configs,
    });
  } catch (error) {
    next(error);
  }
}

// Obtener configuración por clave
export async function getConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const { key } = req.params;
    const value = await configService.getConfig(key);
    
    if (value === null) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada',
      });
    }
    
    res.json({
      success: true,
      data: { key, value },
    });
  } catch (error) {
    next(error);
  }
}

// Establecer configuración
export async function setConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const { key, value, description } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Key y value son requeridos',
      });
    }
    
    const config = await configService.setConfig(key, String(value), description);
    
    logger.info(`Configuración actualizada: ${key}`, { userId: req.user?.userId });
    
    res.json({
      success: true,
      message: 'Configuración guardada',
      data: config,
    });
  } catch (error) {
    next(error);
  }
}

// Establecer múltiples configuraciones
export async function setConfigs(req: Request, res: Response, next: NextFunction) {
  try {
    const { configs } = req.body;
    
    if (!configs || typeof configs !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Configs debe ser un objeto',
      });
    }
    
    await configService.setConfigs(configs);
    
    logger.info(`Configuraciones actualizadas: ${Object.keys(configs).length} keys`, { 
      userId: req.user?.userId,
      keys: Object.keys(configs),
    });
    
    res.json({
      success: true,
      message: 'Configuraciones guardadas',
    });
  } catch (error) {
    next(error);
  }
}

// Eliminar configuración
export async function deleteConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const { key } = req.params;
    
    await configService.deleteConfig(key);
    
    logger.info(`Configuración eliminada: ${key}`, { userId: req.user?.userId });
    
    res.json({
      success: true,
      message: 'Configuración eliminada',
    });
  } catch (error) {
    next(error);
  }
}

// Inicializar configuraciones predeterminadas
export async function initializeDefaults(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await configService.initializeDefaults();
    
    res.json({
      success: true,
      message: `${count} configuraciones inicializadas`,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
}
