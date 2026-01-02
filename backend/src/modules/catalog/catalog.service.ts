// =====================================================
// SERVICIO DE CATÁLOGO DE PRODUCTOS
// =====================================================

import { prisma } from '../../config/database.js';

// =====================================================
// PANELES SOLARES
// =====================================================

export interface CreatePanelInput {
  brand: string;
  model: string;
  power: number;
  efficiency: number;
  warranty: number;
  price: number;
  isActive?: boolean;
}

export interface UpdatePanelInput {
  brand?: string;
  model?: string;
  power?: number;
  efficiency?: number;
  warranty?: number;
  price?: number;
  isActive?: boolean;
}

// Crear panel
export async function createPanel(input: CreatePanelInput) {
  return prisma.panelCatalog.create({
    data: input,
  });
}

// Obtener todos los paneles
export async function getPanels(includeInactive = false) {
  const where = includeInactive ? {} : { isActive: true };
  return prisma.panelCatalog.findMany({
    where,
    orderBy: [{ brand: 'asc' }, { power: 'desc' }],
  });
}

// Obtener panel por ID
export async function getPanelById(id: string) {
  return prisma.panelCatalog.findUnique({
    where: { id },
  });
}

// Actualizar panel
export async function updatePanel(id: string, input: UpdatePanelInput) {
  return prisma.panelCatalog.update({
    where: { id },
    data: input,
  });
}

// Eliminar panel (soft delete)
export async function deletePanel(id: string) {
  return prisma.panelCatalog.update({
    where: { id },
    data: { isActive: false },
  });
}

// Eliminar panel permanentemente
export async function deletePanelPermanent(id: string) {
  return prisma.panelCatalog.delete({
    where: { id },
  });
}

// =====================================================
// INVERSORES
// =====================================================

export interface CreateInverterInput {
  brand: string;
  model: string;
  power: number;
  phases: number;
  warranty: number;
  price: number;
  isActive?: boolean;
}

export interface UpdateInverterInput {
  brand?: string;
  model?: string;
  power?: number;
  phases?: number;
  warranty?: number;
  price?: number;
  isActive?: boolean;
}

// Crear inversor
export async function createInverter(input: CreateInverterInput) {
  return prisma.inverterCatalog.create({
    data: input,
  });
}

// Obtener todos los inversores
export async function getInverters(includeInactive = false) {
  const where = includeInactive ? {} : { isActive: true };
  return prisma.inverterCatalog.findMany({
    where,
    orderBy: [{ brand: 'asc' }, { power: 'desc' }],
  });
}

// Obtener inversor por ID
export async function getInverterById(id: string) {
  return prisma.inverterCatalog.findUnique({
    where: { id },
  });
}

// Actualizar inversor
export async function updateInverter(id: string, input: UpdateInverterInput) {
  return prisma.inverterCatalog.update({
    where: { id },
    data: input,
  });
}

// Eliminar inversor (soft delete)
export async function deleteInverter(id: string) {
  return prisma.inverterCatalog.update({
    where: { id },
    data: { isActive: false },
  });
}

// Eliminar inversor permanentemente
export async function deleteInverterPermanent(id: string) {
  return prisma.inverterCatalog.delete({
    where: { id },
  });
}

// =====================================================
// CIUDADES HSP
// =====================================================

export interface CreateCityHSPInput {
  city: string;
  state: string;
  hsp: number;
  latitude?: number;
  longitude?: number;
}

export interface UpdateCityHSPInput {
  city?: string;
  state?: string;
  hsp?: number;
  latitude?: number;
  longitude?: number;
}

// Crear ciudad
export async function createCityHSP(input: CreateCityHSPInput) {
  return prisma.cityHSP.create({
    data: input,
  });
}

// Obtener todas las ciudades
export async function getCitiesHSP() {
  return prisma.cityHSP.findMany({
    orderBy: [{ state: 'asc' }, { city: 'asc' }],
  });
}

// Obtener ciudad por ID
export async function getCityHSPById(id: string) {
  return prisma.cityHSP.findUnique({
    where: { id },
  });
}

// Obtener HSP por ciudad
export async function getHSPByCity(city: string) {
  return prisma.cityHSP.findUnique({
    where: { city },
  });
}

// Actualizar ciudad
export async function updateCityHSP(id: string, input: UpdateCityHSPInput) {
  return prisma.cityHSP.update({
    where: { id },
    data: input,
  });
}

// Eliminar ciudad
export async function deleteCityHSP(id: string) {
  return prisma.cityHSP.delete({
    where: { id },
  });
}

// =====================================================
// ESTADÍSTICAS DEL CATÁLOGO
// =====================================================

export async function getCatalogStats() {
  const [panelsCount, invertersCount, citiesCount] = await Promise.all([
    prisma.panelCatalog.count({ where: { isActive: true } }),
    prisma.inverterCatalog.count({ where: { isActive: true } }),
    prisma.cityHSP.count(),
  ]);

  return {
    panels: panelsCount,
    inverters: invertersCount,
    cities: citiesCount,
  };
}
