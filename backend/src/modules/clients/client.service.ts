// =====================================================
// SERVICIO DE CLIENTES
// =====================================================

import { prisma } from '../../config/database.js';
import { ConflictError, NotFoundError } from '../../shared/errors/index.js';
import type { 
  CreateClientInput, 
  UpdateClientInput, 
  QueryClientsInput 
} from './client.schema.js';

/**
 * Crear nuevo cliente
 */
export const createClient = async (data: CreateClientInput) => {
  // Verificar que no exista un cliente con el mismo email
  const existing = await prisma.client.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existing) {
    throw new ConflictError('Ya existe un cliente con ese email');
  }

  const client = await prisma.client.create({
    data: {
      ...data,
      email: data.email.toLowerCase(),
    },
  });

  return client;
};

/**
 * Obtener todos los clientes con paginación y filtros
 */
export const getClients = async (query: QueryClientsInput) => {
  const { search, city, tariff, page, limit, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  // Construir filtros
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
    ];
  }

  if (city) {
    where.city = { contains: city, mode: 'insensitive' };
  }

  if (tariff) {
    where.cfeTariff = tariff;
  }

  // Ejecutar consultas en paralelo
  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: { quotations: true, projects: true },
        },
      },
    }),
    prisma.client.count({ where }),
  ]);

  return {
    clients,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Obtener cliente por ID
 */
export const getClientById = async (id: string) => {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      quotations: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          quoteNumber: true,
          systemSize: true,
          salePrice: true,
          status: true,
          createdAt: true,
        },
      },
      projects: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          projectNumber: true,
          status: true,
          totalAmount: true,
          paidAmount: true,
          createdAt: true,
        },
      },
      _count: {
        select: { quotations: true, projects: true },
      },
    },
  });

  if (!client) {
    throw new NotFoundError('Cliente');
  }

  return client;
};

/**
 * Actualizar cliente
 */
export const updateClient = async (id: string, data: UpdateClientInput) => {
  // Verificar que existe
  const existing = await prisma.client.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new NotFoundError('Cliente');
  }

  // Si se actualiza el email, verificar que no esté en uso
  if (data.email && data.email.toLowerCase() !== existing.email) {
    const emailInUse = await prisma.client.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (emailInUse) {
      throw new ConflictError('El email ya está en uso por otro cliente');
    }
  }

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...data,
      email: data.email?.toLowerCase(),
    },
  });

  return client;
};

/**
 * Eliminar cliente
 */
export const deleteClient = async (id: string) => {
  // Verificar que existe
  const existing = await prisma.client.findUnique({
    where: { id },
    include: {
      _count: {
        select: { quotations: true, projects: true },
      },
    },
  });

  if (!existing) {
    throw new NotFoundError('Cliente');
  }

  // No permitir eliminar si tiene cotizaciones o proyectos
  if (existing._count.quotations > 0 || existing._count.projects > 0) {
    throw new ConflictError(
      'No se puede eliminar el cliente porque tiene cotizaciones o proyectos asociados'
    );
  }

  await prisma.client.delete({
    where: { id },
  });

  return { success: true };
};

/**
 * Buscar clientes (para autocompletado)
 */
export const searchClients = async (search: string, limit: number = 10) => {
  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ],
    },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
    },
  });

  return clients;
};

/**
 * Obtener estadísticas de clientes
 */
export const getClientStats = async () => {
  const [total, byCity, byTariff, recentClients] = await Promise.all([
    // Total de clientes
    prisma.client.count(),
    
    // Clientes por ciudad (top 5)
    prisma.client.groupBy({
      by: ['city'],
      _count: { city: true },
      orderBy: { _count: { city: 'desc' } },
      take: 5,
    }),
    
    // Clientes por tarifa
    prisma.client.groupBy({
      by: ['cfeTariff'],
      _count: { cfeTariff: true },
      where: { cfeTariff: { not: null } },
    }),
    
    // Últimos 5 clientes
    prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    total,
    byCity: byCity.map((c) => ({ city: c.city, count: c._count.city })),
    byTariff: byTariff.map((t) => ({ tariff: t.cfeTariff, count: t._count.cfeTariff })),
    recentClients,
  };
};
