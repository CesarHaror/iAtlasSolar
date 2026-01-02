// =====================================================
// CONTROLADOR DE AUTENTICACIÓN
// =====================================================

import { Request, Response } from 'express';
import * as authService from './auth.service.js';
import { 
  loginSchema, 
  registerSchema, 
  changePasswordSchema 
} from './auth.schema.js';
import { asyncHandler } from '../../shared/middleware/index.js';

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = loginSchema.parse(req.body);
  const result = await authService.login(validatedData);

  res.json({
    success: true,
    message: 'Inicio de sesión exitoso',
    data: result,
  });
});

/**
 * POST /api/auth/register
 * Registrar nuevo usuario (solo admin)
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = registerSchema.parse(req.body);
  const creatorRole = req.user?.role;
  
  const result = await authService.register(validatedData, creatorRole);

  res.status(201).json({
    success: true,
    message: 'Usuario registrado exitosamente',
    data: result,
  });
});

/**
 * GET /api/auth/profile
 * Obtener perfil del usuario actual
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const profile = await authService.getProfile(userId);

  res.json({
    success: true,
    data: profile,
  });
});

/**
 * PUT /api/auth/profile
 * Actualizar perfil del usuario actual
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { name, phone } = req.body;

  const updatedProfile = await authService.updateProfile(userId, { name, phone });

  res.json({
    success: true,
    message: 'Perfil actualizado',
    data: updatedProfile,
  });
});

/**
 * PUT /api/auth/change-password
 * Cambiar contraseña
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const validatedData = changePasswordSchema.parse(req.body);

  await authService.changePassword(userId, validatedData);

  res.json({
    success: true,
    message: 'Contraseña actualizada exitosamente',
  });
});

/**
 * POST /api/auth/verify
 * Verificar si el token es válido
 */
export const verifyAuth = asyncHandler(async (req: Request, res: Response) => {
  // Si llegó aquí, el token es válido (pasó el middleware authenticate)
  res.json({
    success: true,
    message: 'Token válido',
    data: {
      userId: req.user!.userId,
      email: req.user!.email,
      role: req.user!.role,
    },
  });
});

/**
 * POST /api/auth/logout
 * Cerrar sesión (cliente debe eliminar el token)
 */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // En JWT stateless, el cliente solo elimina el token
  // Aquí podríamos invalidar el token en una blacklist si implementamos eso

  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente',
  });
});
