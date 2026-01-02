// =====================================================
// CONSTANTES DEL SISTEMA
// =====================================================

// Tarifas CFE - Límites de consumo mensual (kWh)
export const CFE_TARIFF_LIMITS = {
  T1:  { basic: 75,  total: 250 },
  T1A: { basic: 100, total: 300 },
  T1B: { basic: 125, total: 400 },
  T1C: { basic: 150, total: 850 },
  T1D: { basic: 175, total: 1000 },
  T1E: { basic: 200, total: 2000 },
  T1F: { basic: 300, total: 2500 },
  DAC: { basic: 0,   total: Infinity },
} as const;

// Porcentaje de ahorro por tarifa
export const SAVINGS_PERCENTAGE_BY_TARIFF = {
  T1:  0.95,
  T1A: 0.95,
  T1B: 0.95,
  T1C: 0.95,
  T1D: 0.96,
  T1E: 0.96,
  T1F: 0.97,
  DAC: 0.98, // Mayor ahorro porque la tarifa es muy cara
} as const;

// Precios aproximados por kWh según tarifa (2024-2025)
export const APPROXIMATE_KWH_PRICE = {
  T1:  { basic: 1.015, intermediate: 1.239, excess: 3.620 },
  T1A: { basic: 0.930, intermediate: 1.130, excess: 3.420 },
  T1B: { basic: 0.870, intermediate: 1.050, excess: 3.280 },
  T1C: { basic: 0.820, intermediate: 0.980, excess: 3.150 },
  T1D: { basic: 0.780, intermediate: 0.920, excess: 3.050 },
  T1E: { basic: 0.750, intermediate: 0.880, excess: 2.950 },
  T1F: { basic: 0.720, intermediate: 0.850, excess: 2.850 },
  DAC: { basic: 5.76, intermediate: 5.76, excess: 5.76 }, // Sin escalones, todo caro
} as const;

// HSP por defecto para ciudades no registradas
export const DEFAULT_HSP = 5.5;

// Eficiencia del sistema (pérdidas típicas)
export const SYSTEM_LOSSES = {
  dust: 0.03,        // Suciedad en paneles: 3%
  temperature: 0.04, // Pérdida por temperatura: 4%
  wiring: 0.02,      // Cableado: 2%
  inverter: 0.04,    // Inversor: 4%
  mismatch: 0.02,    // Mismatch: 2%
  degradation: 0.005, // Degradación anual: 0.5%
  // Total típico: ~15% de pérdidas = 85% eficiencia
  // Usamos 80% para ser conservadores
} as const;

// Desglose típico de costos (porcentajes)
export const COST_BREAKDOWN_PERCENTAGES = {
  panels: 0.40,      // 40% - Paneles solares
  inverter: 0.20,    // 20% - Inversor
  structure: 0.12,   // 12% - Estructura de montaje
  installation: 0.15,// 15% - Instalación
  cfeProcess: 0.08,  // 8% - Trámites CFE
  warranty: 0.05,    // 5% - Garantía extendida
} as const;

// Estados de cotización
export const QUOTATION_STATUS_LABELS = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  VIEWED: 'Vista',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
} as const;

// Estados de proyecto
export const PROJECT_STATUS_LABELS = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
} as const;

// Roles y sus permisos
export const ROLE_PERMISSIONS = {
  ADMIN: ['all'],
  VENDEDOR: ['quotations:create', 'quotations:read', 'quotations:update', 'quotations:send', 'clients:all'],
  INSTALADOR: ['projects:read', 'projects:update'],
  VIEWER: ['quotations:read', 'projects:read', 'clients:read'],
} as const;
