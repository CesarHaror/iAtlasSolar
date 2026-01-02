import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export interface ValidatedRequest extends Request {
  validatedData?: any;
}

// Middleware para validar tipos de archivo
export const validateFileType = (allowedMimes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next();
    }

    const fileMime = req.file.mimetype;
    if (!allowedMimes.includes(fileMime)) {
      logger.warn({
        message: 'Invalid file type attempted',
        fileMime,
        allowedMimes,
        ip: req.ip,
      });
      return res.status(400).json({
        status: 'error',
        message: `Tipo de archivo no permitido. Acepta: ${allowedMimes.join(', ')}`,
      });
    }

    next();
  };
};

// Middleware para validar tamaño de archivo
export const validateFileSize = (maxSizeBytes: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next();
    }

    if (req.file.size > maxSizeBytes) {
      logger.warn({
        message: 'File size exceeded',
        fileSize: req.file.size,
        maxSize: maxSizeBytes,
        ip: req.ip,
      });
      return res.status(413).json({
        status: 'error',
        message: `Archivo muy grande. Máximo: ${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB`,
      });
    }

    next();
  };
};

// Middleware para validar entrada JSON
export const validateJSONInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (!req.is('application/json')) {
      logger.warn({
        message: 'Invalid content-type',
        contentType: req.headers['content-type'],
        path: req.path,
        ip: req.ip,
      });
      return res.status(415).json({
        status: 'error',
        message: 'Content-Type debe ser application/json',
      });
    }
  }

  next();
};
