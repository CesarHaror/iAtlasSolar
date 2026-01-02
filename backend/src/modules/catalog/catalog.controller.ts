// =====================================================
// CONTROLADOR DE CATÁLOGO
// =====================================================

import { Request, Response, NextFunction } from 'express';
import * as catalogService from './catalog.service.js';
import {
  createPanelSchema,
  updatePanelSchema,
  createInverterSchema,
  updateInverterSchema,
  createCityHSPSchema,
  updateCityHSPSchema,
} from './catalog.schema.js';
import { logger } from '../../shared/utils/logger.js';

// =====================================================
// PANELES
// =====================================================

export async function createPanel(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createPanelSchema.parse(req.body);
    const panel = await catalogService.createPanel(input);
    
    logger.info(`Panel creado: ${panel.brand} ${panel.model}`, { panelId: panel.id });
    
    res.status(201).json({
      success: true,
      message: 'Panel creado exitosamente',
      data: panel,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPanels(req: Request, res: Response, next: NextFunction) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const panels = await catalogService.getPanels(includeInactive);
    
    res.json({
      success: true,
      data: panels,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPanelById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const panel = await catalogService.getPanelById(id);
    
    if (!panel) {
      return res.status(404).json({
        success: false,
        message: 'Panel no encontrado',
      });
    }
    
    res.json({
      success: true,
      data: panel,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePanel(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const input = updatePanelSchema.parse(req.body);
    const panel = await catalogService.updatePanel(id, input);
    
    logger.info(`Panel actualizado: ${panel.brand} ${panel.model}`, { panelId: panel.id });
    
    res.json({
      success: true,
      message: 'Panel actualizado exitosamente',
      data: panel,
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePanel(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const permanent = req.query.permanent === 'true';
    
    if (permanent) {
      await catalogService.deletePanelPermanent(id);
    } else {
      await catalogService.deletePanel(id);
    }
    
    logger.info(`Panel eliminado: ${id}`, { permanent });
    
    res.json({
      success: true,
      message: 'Panel eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================
// INVERSORES
// =====================================================

export async function createInverter(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createInverterSchema.parse(req.body);
    const inverter = await catalogService.createInverter(input);
    
    logger.info(`Inversor creado: ${inverter.brand} ${inverter.model}`, { inverterId: inverter.id });
    
    res.status(201).json({
      success: true,
      message: 'Inversor creado exitosamente',
      data: inverter,
    });
  } catch (error) {
    next(error);
  }
}

export async function getInverters(req: Request, res: Response, next: NextFunction) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const inverters = await catalogService.getInverters(includeInactive);
    
    res.json({
      success: true,
      data: inverters,
    });
  } catch (error) {
    next(error);
  }
}

export async function getInverterById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const inverter = await catalogService.getInverterById(id);
    
    if (!inverter) {
      return res.status(404).json({
        success: false,
        message: 'Inversor no encontrado',
      });
    }
    
    res.json({
      success: true,
      data: inverter,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateInverter(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const input = updateInverterSchema.parse(req.body);
    const inverter = await catalogService.updateInverter(id, input);
    
    logger.info(`Inversor actualizado: ${inverter.brand} ${inverter.model}`, { inverterId: inverter.id });
    
    res.json({
      success: true,
      message: 'Inversor actualizado exitosamente',
      data: inverter,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteInverter(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const permanent = req.query.permanent === 'true';
    
    if (permanent) {
      await catalogService.deleteInverterPermanent(id);
    } else {
      await catalogService.deleteInverter(id);
    }
    
    logger.info(`Inversor eliminado: ${id}`, { permanent });
    
    res.json({
      success: true,
      message: 'Inversor eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================
// CIUDADES HSP
// =====================================================

export async function createCityHSP(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createCityHSPSchema.parse(req.body);
    const city = await catalogService.createCityHSP(input);
    
    logger.info(`Ciudad HSP creada: ${city.city}`, { cityId: city.id });
    
    res.status(201).json({
      success: true,
      message: 'Ciudad creada exitosamente',
      data: city,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCitiesHSP(req: Request, res: Response, next: NextFunction) {
  try {
    const cities = await catalogService.getCitiesHSP();
    
    res.json({
      success: true,
      data: cities,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCityHSPById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const city = await catalogService.getCityHSPById(id);
    
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'Ciudad no encontrada',
      });
    }
    
    res.json({
      success: true,
      data: city,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCityHSP(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const input = updateCityHSPSchema.parse(req.body);
    const city = await catalogService.updateCityHSP(id, input);
    
    logger.info(`Ciudad HSP actualizada: ${city.city}`, { cityId: city.id });
    
    res.json({
      success: true,
      message: 'Ciudad actualizada exitosamente',
      data: city,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCityHSP(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await catalogService.deleteCityHSP(id);
    
    logger.info(`Ciudad HSP eliminada: ${id}`);
    
    res.json({
      success: true,
      message: 'Ciudad eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
}

// =====================================================
// ESTADÍSTICAS
// =====================================================

export async function getCatalogStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await catalogService.getCatalogStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
