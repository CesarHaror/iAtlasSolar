// =====================================================
// UTILIDADES GENERALES
// =====================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combinar clases de Tailwind de forma segura
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatear número como moneda (MXN)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatear número con separadores de miles
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Formatear fecha
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Formatear fecha corta
 */
export function formatShortDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Delay/sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validar email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Capitalizar primera letra
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncar texto
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Generar ID único simple
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Mapeo de estados de cotización a español
 */
export const QUOTATION_STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Borrador', color: 'gray' },
  SENT: { label: 'Enviada', color: 'blue' },
  VIEWED: { label: 'Vista', color: 'purple' },
  APPROVED: { label: 'Aprobada', color: 'green' },
  REJECTED: { label: 'Rechazada', color: 'red' },
  EXPIRED: { label: 'Expirada', color: 'orange' },
};

/**
 * Mapeo de tarifas CFE
 */
export const CFE_TARIFF_MAP: Record<string, string> = {
  T1: 'Tarifa 1 - Templada',
  T1A: 'Tarifa 1A - Mínimo 25°C',
  T1B: 'Tarifa 1B - Mínimo 28°C',
  T1C: 'Tarifa 1C - Mínimo 30°C',
  T1D: 'Tarifa 1D - Mínimo 31°C',
  T1E: 'Tarifa 1E - Mínimo 32°C',
  T1F: 'Tarifa 1F - Mínimo 33°C',
  DAC: 'DAC - Alto Consumo',
};
