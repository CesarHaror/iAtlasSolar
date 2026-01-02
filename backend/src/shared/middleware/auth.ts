// =====================================================
// MIDDLEWARE DE AUTENTICACIÓN JWT
// =====================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { AuthenticationError, AuthorizationError } from '../errors/index.js';
import { Role } from '@prisma/client';

// Extender Request para incluir usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: Role;
      };
    }
  }
}

interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}

/**
 * Middleware para verificar token JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Obtener token del header o query params (para URLs de PDF)
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token as string | undefined;
    
    let token: string | undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (queryToken) {
      // Permitir token desde query params (útil para abrir PDFs en nueva ventana)
      token = queryToken;
    }

    if (!token) {
      throw new AuthenticationError('Token no proporcionado');
    }

    // Verificar token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    // Añadir usuario al request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AuthenticationError('Token expirado'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Token inválido'));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware para verificar roles
 * @param allowedRoles - Roles permitidos para acceder al recurso
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('No autenticado'));
      return;
    }

    // Admin tiene acceso a todo
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AuthorizationError('No tienes permisos para esta acción'));
      return;
    }

    next();
  };
};

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      }
    }
    
    next();
  } catch {
    // Si el token es inválido, simplemente continuar sin usuario
    next();
  }
};
