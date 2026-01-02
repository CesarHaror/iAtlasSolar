// =====================================================
// SERVICIO DE AUTENTICACIÓN
// =====================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { config } from '../../config/index.js';
import { 
  AuthenticationError, 
  ConflictError, 
  NotFoundError 
} from '../../shared/errors/index.js';
import type { LoginInput, RegisterInput, ChangePasswordInput } from './auth.schema.js';
import { Role } from '@prisma/client';

interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    phone: string | null;
  };
  token: string;
  expiresIn: string;
}

/**
 * Generar token JWT
 */
const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as string,
  } as jwt.SignOptions);
};

/**
 * Login de usuario
 */
export const login = async (input: LoginInput): Promise<AuthResponse> => {
  const { email, password } = input;

  // Buscar usuario
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new AuthenticationError('Credenciales inválidas');
  }

  // Verificar si está activo
  if (!user.isActive) {
    throw new AuthenticationError('Tu cuenta ha sido desactivada');
  }

  // Verificar contraseña
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new AuthenticationError('Credenciales inválidas');
  }

  // Actualizar último login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generar token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
    },
    token,
    expiresIn: config.jwt.expiresIn,
  };
};

/**
 * Registro de nuevo usuario (solo admin puede crear usuarios)
 */
export const register = async (
  input: RegisterInput, 
  creatorRole?: Role
): Promise<AuthResponse> => {
  const { email, password, name, phone } = input;

  // Verificar que no exista
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new ConflictError('El email ya está registrado');
  }

  // Hash de contraseña
  const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

  // Determinar rol (solo admin puede crear otros admins)
  const role = creatorRole === 'ADMIN' ? Role.VENDEDOR : Role.VENDEDOR;

  // Crear usuario
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phone: phone || null,
      role,
      isActive: true,
    },
  });

  // Generar token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
    },
    token,
    expiresIn: config.jwt.expiresIn,
  };
};

/**
 * Obtener perfil del usuario actual
 */
export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('Usuario');
  }

  return user;
};

/**
 * Cambiar contraseña
 */
export const changePassword = async (
  userId: string, 
  input: ChangePasswordInput
): Promise<void> => {
  const { currentPassword, newPassword } = input;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('Usuario');
  }

  // Verificar contraseña actual
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);

  if (!isValidPassword) {
    throw new AuthenticationError('Contraseña actual incorrecta');
  }

  // Hash de nueva contraseña
  const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);

  // Actualizar contraseña
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};

/**
 * Actualizar perfil
 */
export const updateProfile = async (
  userId: string,
  data: { name?: string; phone?: string }
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
    },
  });

  return user;
};

/**
 * Verificar token (para validar sesión)
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload;
  } catch {
    throw new AuthenticationError('Token inválido');
  }
};
