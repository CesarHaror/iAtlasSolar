// =====================================================
// CONTROLADOR DE UPLOAD DE ARCHIVOS
// =====================================================

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { logger } from '../../shared/utils/logger.js';

// Configuración de Multer para almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/images';
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Filtro de archivos (solo imágenes)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP, SVG)'));
  }
};

// Configuración de Multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
});

// Subir imagen
export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo',
      });
    }

    // Construir URL relativa del archivo (el frontend añadirá el host)
    const fileUrl = `/${req.file.path.replace(/\\/g, '/')}`;

    logger.info(`Archivo subido: ${req.file.filename}`, {
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    res.json({
      success: true,
      message: 'Archivo subido exitosamente',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Eliminar imagen
export async function deleteImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { filename } = req.params;
    const filePath = path.join('uploads/images', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Archivo eliminado: ${filename}`);
      
      res.json({
        success: true,
        message: 'Archivo eliminado exitosamente',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Archivo no encontrado',
      });
    }
  } catch (error) {
    next(error);
  }
}
