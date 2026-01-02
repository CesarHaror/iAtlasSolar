// =====================================================
// SERVICIO DE CÁLCULOS SOLARES
// Motor de cálculo para dimensionamiento de sistemas
// =====================================================

import { prisma } from '../../config/database';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface ConsumptionData {
  monthlyKwh: number;          // Consumo mensual promedio en kWh
  bimonthlyBill?: number;      // Monto del recibo bimestral (opcional)
  cfeTariff: string;           // Tipo de tarifa CFE
}

export interface LocationData {
  city: string;
  state?: string;
  customHSP?: number;          // HSP personalizado si no está en catálogo
}

export interface SystemConfig {
  panelId?: string;            // ID del panel del catálogo
  inverterId?: string;         // ID del inversor del catálogo
  installationType: 'ROOF' | 'GROUND' | 'CARPORT';
  systemLosses?: number;       // Pérdidas del sistema (default 14%)
  degradationRate?: number;    // Degradación anual (default 0.5%)
  marginPercentage?: number;   // Margen de ganancia (default 25%)
}

export interface CalculationResult {
  // Dimensionamiento
  systemSizeKwp: number;
  numberOfPanels: number;
  numberOfInverters: number;
  roofAreaM2: number;
  annualGenerationKwh: number;
  monthlyGenerationKwh: number;
  
  // Panel e inversor seleccionados
  panel: {
    id: string;
    brand: string;
    model: string;
    watts: number;
    price: number;
  };
  inverter: {
    id: string;
    brand: string;
    model: string;
    capacityKw: number;
    price: number;
  };
  
  // Costos
  panelsCost: number;
  invertersCost: number;
  installationCost: number;
  structureCost: number;
  electricalMaterialsCost: number;
  laborCost: number;
  subtotal: number;
  margin: number;
  totalBeforeTax: number;
  iva: number;
  totalPrice: number;
  pricePerWatt: number;
  
  // Ahorros y ROI
  monthlyBillBefore: number;
  monthlyBillAfter: number;
  monthlySavings: number;
  annualSavings: number;
  savingsPercentage: number;
  consumptionCoveragePercent: number;
  paybackYears: number;
  roi25Years: number;
  lifetimeSavings: number;
  
  // Datos CFE
  cfeTariff: string;
  tariffRate: number;
  hsp: number;
  
  // Ambiental
  co2OffsetTons: number;
  treesEquivalent: number;
}

// =====================================================
// CONSTANTES DE TARIFAS CFE 2024
// =====================================================

// Tarifas promedio por kWh según tipo (pesos mexicanos)
const CFE_TARIFF_RATES: Record<string, { basic: number; intermediate: number; excess: number; dac: number }> = {
  'T01': { basic: 0.987, intermediate: 1.198, excess: 3.616, dac: 5.80 }, // Tarifa 01 original
  'T1': { basic: 0.987, intermediate: 1.198, excess: 3.616, dac: 5.80 },
  'T1A': { basic: 0.987, intermediate: 1.198, excess: 3.616, dac: 5.80 },
  'T1B': { basic: 0.987, intermediate: 1.198, excess: 3.616, dac: 5.80 },
  'T1C': { basic: 0.987, intermediate: 1.198, excess: 3.616, dac: 5.80 },
  'T1D': { basic: 0.987, intermediate: 1.198, excess: 3.616, dac: 5.80 },
  'T1E': { basic: 0.987, intermediate: 1.198, excess: 3.616, dac: 5.80 },
  'T1F': { basic: 0.987, intermediate: 1.198, excess: 3.616, dac: 5.80 },
  'DAC': { basic: 5.80, intermediate: 5.80, excess: 5.80, dac: 5.80 },
  // Tarifas comerciales/industriales
  'PDBT': { basic: 1.45, intermediate: 1.45, excess: 1.45, dac: 1.45 }, // Pequeña Demanda Baja Tensión
  // Tarifas industriales de media tensión
  'GDMTO': { basic: 1.45, intermediate: 1.45, excess: 1.45, dac: 1.45 }, // Tarifa uniforme
  'GDMTH': { basic: 1.20, intermediate: 1.85, excess: 2.95, dac: 2.95 }, // Base, Intermedio, Punta
};

// =====================================================
// CONFIGURACIÓN TARIFA GDMTH (Gran Demanda Media Tensión Horaria)
// Aplica a servicios con demanda ≥100 kW en media tensión
// =====================================================

// Tarifas GDMTH por periodo horario (pesos por kWh) - Actualizado 2024
const GDMTH_ENERGY_RATES = {
  base: 0.7832,        // Periodo base (nocturno, madrugada)
  intermedio: 1.2145,  // Periodo intermedio (día normal)
  punta: 1.8956,       // Periodo punta (máxima demanda)
};

// Cargo por demanda ($/kW-mes)
const GDMTH_DEMAND_CHARGES = {
  base: 78.45,         // Cargo por kW de demanda en periodo base
  intermedio: 156.89,  // Cargo por kW de demanda en periodo intermedio
  punta: 312.67,       // Cargo por kW de demanda en periodo punta
};

// Cargo fijo mensual GDMTH
const GDMTH_FIXED_CHARGE = 523.45; // $/mes

// Distribución típica de consumo por periodo (porcentaje) - basado en operación industrial típica
const GDMTH_CONSUMPTION_DISTRIBUTION = {
  base: 0.25,        // 25% del consumo en horario base (noche/madrugada)
  intermedio: 0.55,  // 55% del consumo en horario intermedio (día)
  punta: 0.20,       // 20% del consumo en horario punta (tarde)
};

// Distribución típica de demanda por periodo (kW relativos al máximo)
const GDMTH_DEMAND_DISTRIBUTION = {
  base: 0.40,        // 40% de la demanda máxima en base
  intermedio: 0.85,  // 85% de la demanda máxima en intermedio
  punta: 1.00,       // 100% demanda máxima en punta
};

// Horarios típicos GDMTH (varían según región y temporada)
const GDMTH_SCHEDULE = {
  verano: {
    base: '00:00-06:00',
    intermedio: '06:00-20:00',
    punta: '20:00-22:00',
    base2: '22:00-24:00',
  },
  invierno: {
    base: '00:00-06:00',
    intermedio: '06:00-18:00, 22:00-24:00',
    punta: '18:00-22:00',
  },
};

// =====================================================
// CONFIGURACIÓN TARIFA GDMTO (Gran Demanda Media Tensión Ordinaria)
// Aplica a servicios con demanda <100 kW en media tensión
// =====================================================

const GDMTO_ENERGY_RATE = 1.4523;  // $/kWh (tarifa única)
const GDMTO_DEMAND_CHARGE = 198.56; // $/kW-mes
const GDMTO_FIXED_CHARGE = 312.78;  // $/mes

// Límites de consumo por tarifa (kWh bimestrales)
const TARIFF_LIMITS: Record<string, { basic: number; intermediate: number; dacThreshold: number }> = {
  'T01': { basic: 150, intermediate: 280, dacThreshold: 500 }, // Tarifa 01 original
  'T1': { basic: 150, intermediate: 280, dacThreshold: 500 },
  'T1A': { basic: 150, intermediate: 280, dacThreshold: 500 },
  'T1B': { basic: 200, intermediate: 400, dacThreshold: 800 },
  'T1C': { basic: 250, intermediate: 450, dacThreshold: 900 },
  'T1D': { basic: 300, intermediate: 500, dacThreshold: 1000 },
  'T1E': { basic: 300, intermediate: 600, dacThreshold: 1200 },
  'T1F': { basic: 300, intermediate: 750, dacThreshold: 1500 },
  'DAC': { basic: 0, intermediate: 0, dacThreshold: 0 },
  // Tarifas comerciales
  'PDBT': { basic: 0, intermediate: 0, dacThreshold: 0 },
  // Tarifas industriales - sin escalones domésticos
  'GDMTO': { basic: 0, intermediate: 0, dacThreshold: 0 },
  'GDMTH': { basic: 0, intermediate: 0, dacThreshold: 0 },
};

// Costos de instalación por tipo (por watt)
const INSTALLATION_COSTS: Record<string, number> = {
  'ROOF': 2.5,      // $2.5 MXN por watt
  'GROUND': 3.5,    // $3.5 MXN por watt
  'CARPORT': 5.0,   // $5.0 MXN por watt
};

// =====================================================
// FUNCIONES DE CÁLCULO PARA TARIFAS INDUSTRIALES
// =====================================================

/**
 * Estima la demanda en kW basada en el consumo mensual para tarifas industriales
 * Asume un factor de carga típico industrial
 */
export function estimateDemandFromConsumption(monthlyKwh: number, loadFactor: number = 0.65): number {
  // Demanda = Consumo / (horas del mes * factor de carga)
  const hoursPerMonth = 730; // ~30.4 días * 24 horas
  const demandKw = monthlyKwh / (hoursPerMonth * loadFactor);
  return Math.round(demandKw * 100) / 100;
}

/**
 * Calcula el recibo mensual para tarifa GDMTH
 * Incluye: cargo fijo + cargo por energía (3 periodos) + cargo por demanda (3 periodos)
 */
export function calculateGDMTHBill(monthlyKwh: number, demandKw?: number): {
  total: number;
  breakdown: {
    cargoFijo: number;
    energiaBase: number;
    energiaIntermedio: number;
    energiaPunta: number;
    demandaBase: number;
    demandaIntermedio: number;
    demandaPunta: number;
  };
  effectiveRate: number;
} {
  // Estimar demanda si no se proporciona
  const estimatedDemand = demandKw || estimateDemandFromConsumption(monthlyKwh);
  
  // Cargo fijo mensual
  const cargoFijo = GDMTH_FIXED_CHARGE;
  
  // Distribución del consumo por periodo
  const consumoBase = monthlyKwh * GDMTH_CONSUMPTION_DISTRIBUTION.base;
  const consumoIntermedio = monthlyKwh * GDMTH_CONSUMPTION_DISTRIBUTION.intermedio;
  const consumoPunta = monthlyKwh * GDMTH_CONSUMPTION_DISTRIBUTION.punta;
  
  // Cargo por energía por periodo
  const energiaBase = consumoBase * GDMTH_ENERGY_RATES.base;
  const energiaIntermedio = consumoIntermedio * GDMTH_ENERGY_RATES.intermedio;
  const energiaPunta = consumoPunta * GDMTH_ENERGY_RATES.punta;
  
  // Demanda por periodo (basada en distribución típica)
  const demandaBase = estimatedDemand * GDMTH_DEMAND_DISTRIBUTION.base * GDMTH_DEMAND_CHARGES.base;
  const demandaIntermedio = estimatedDemand * GDMTH_DEMAND_DISTRIBUTION.intermedio * GDMTH_DEMAND_CHARGES.intermedio;
  const demandaPunta = estimatedDemand * GDMTH_DEMAND_DISTRIBUTION.punta * GDMTH_DEMAND_CHARGES.punta;
  
  const total = cargoFijo + 
    energiaBase + energiaIntermedio + energiaPunta +
    demandaBase + demandaIntermedio + demandaPunta;
  
  return {
    total,
    breakdown: {
      cargoFijo,
      energiaBase,
      energiaIntermedio,
      energiaPunta,
      demandaBase,
      demandaIntermedio,
      demandaPunta,
    },
    effectiveRate: total / monthlyKwh,
  };
}

/**
 * Calcula el recibo mensual para tarifa GDMTO
 * Incluye: cargo fijo + cargo por energía (uniforme) + cargo por demanda
 */
export function calculateGDMTOBill(monthlyKwh: number, demandKw?: number): {
  total: number;
  breakdown: {
    cargoFijo: number;
    energia: number;
    demanda: number;
  };
  effectiveRate: number;
} {
  // Estimar demanda si no se proporciona
  const estimatedDemand = demandKw || estimateDemandFromConsumption(monthlyKwh);
  
  const cargoFijo = GDMTO_FIXED_CHARGE;
  const energia = monthlyKwh * GDMTO_ENERGY_RATE;
  const demanda = estimatedDemand * GDMTO_DEMAND_CHARGE;
  
  const total = cargoFijo + energia + demanda;
  
  return {
    total,
    breakdown: {
      cargoFijo,
      energia,
      demanda,
    },
    effectiveRate: total / monthlyKwh,
  };
}

/**
 * Calcula el ahorro por generación solar en tarifa GDMTH
 * Los paneles generan principalmente en horarios intermedio y punta
 */
export function calculateGDMTHSolarSavings(
  monthlyGenerationKwh: number,
  currentMonthlyKwh: number,
  demandKw?: number
): {
  billBefore: number;
  billAfter: number;
  savings: number;
  savingsPercentage: number;
} {
  // La generación solar ocurre principalmente en horario intermedio y punta
  // Distribución típica de generación solar
  const solarDistribution = {
    base: 0.00,      // No hay generación solar de noche
    intermedio: 0.70, // 70% de la generación en horario intermedio
    punta: 0.30,      // 30% de la generación en horario punta
  };
  
  const billBeforeResult = calculateGDMTHBill(currentMonthlyKwh, demandKw);
  
  // Calcular consumo residual por periodo después de generación solar
  const generacionIntermedio = monthlyGenerationKwh * solarDistribution.intermedio;
  const generacionPunta = monthlyGenerationKwh * solarDistribution.punta;
  
  const consumoBaseNuevo = currentMonthlyKwh * GDMTH_CONSUMPTION_DISTRIBUTION.base;
  const consumoIntermedioNuevo = Math.max(0, 
    currentMonthlyKwh * GDMTH_CONSUMPTION_DISTRIBUTION.intermedio - generacionIntermedio
  );
  const consumoPuntaNuevo = Math.max(0, 
    currentMonthlyKwh * GDMTH_CONSUMPTION_DISTRIBUTION.punta - generacionPunta
  );
  
  const nuevoConsumoTotal = consumoBaseNuevo + consumoIntermedioNuevo + consumoPuntaNuevo;
  
  // Recalcular factura con nuevo consumo
  // Nota: La demanda no cambia significativamente porque los picos siguen siendo necesarios
  const billAfterResult = calculateGDMTHBill(nuevoConsumoTotal, demandKw);
  
  const savings = billBeforeResult.total - billAfterResult.total;
  const savingsPercentage = (savings / billBeforeResult.total) * 100;
  
  return {
    billBefore: billBeforeResult.total,
    billAfter: billAfterResult.total,
    savings,
    savingsPercentage,
  };
}

// =====================================================
// FUNCIONES DE CÁLCULO GENERALES
// =====================================================

/**
 * Calcula la tarifa promedio efectiva según consumo y tipo de tarifa
 */
export function calculateEffectiveTariffRate(
  monthlyKwh: number,
  cfeTariff: string
): number {
  // Para tarifas industriales, usar funciones específicas
  if (cfeTariff === 'GDMTH') {
    const result = calculateGDMTHBill(monthlyKwh);
    return result.effectiveRate;
  }
  
  if (cfeTariff === 'GDMTO') {
    const result = calculateGDMTOBill(monthlyKwh);
    return result.effectiveRate;
  }
  
  // Para tarifas domésticas
  const bimonthlyKwh = monthlyKwh * 2;
  const rates = CFE_TARIFF_RATES[cfeTariff] || CFE_TARIFF_RATES['T1'];
  const limits = TARIFF_LIMITS[cfeTariff] || TARIFF_LIMITS['T1'];
  
  // Si está en DAC, usar tarifa DAC
  if (cfeTariff === 'DAC' || (limits.dacThreshold > 0 && bimonthlyKwh > limits.dacThreshold)) {
    return rates.dac;
  }
  
  // Calcular tarifa promedio ponderada
  let totalCost = 0;
  let remaining = bimonthlyKwh;
  
  // Consumo básico
  const basicConsumption = Math.min(remaining, limits.basic);
  totalCost += basicConsumption * rates.basic;
  remaining -= basicConsumption;
  
  // Consumo intermedio
  if (remaining > 0) {
    const intermediateConsumption = Math.min(remaining, limits.intermediate - limits.basic);
    totalCost += intermediateConsumption * rates.intermediate;
    remaining -= intermediateConsumption;
  }
  
  // Excedente
  if (remaining > 0) {
    totalCost += remaining * rates.excess;
  }
  
  return totalCost / bimonthlyKwh;
}

/**
 * Calcula el recibo mensual estimado según consumo
 */
export function calculateMonthlyBill(
  monthlyKwh: number,
  cfeTariff: string
): number {
  // Para tarifas industriales, usar funciones específicas que incluyen cargos fijos y demanda
  if (cfeTariff === 'GDMTH') {
    const result = calculateGDMTHBill(monthlyKwh);
    return result.total;
  }
  
  if (cfeTariff === 'GDMTO') {
    const result = calculateGDMTOBill(monthlyKwh);
    return result.total;
  }
  
  // Para tarifas domésticas
  const effectiveRate = calculateEffectiveTariffRate(monthlyKwh, cfeTariff);
  return monthlyKwh * effectiveRate;
}

/**
 * Obtiene el HSP (Horas Sol Pico) para una ciudad
 */
export async function getHSPForCity(city: string): Promise<number> {
  const cityData = await prisma.cityHSP.findFirst({
    where: {
      OR: [
        { city: { contains: city, mode: 'insensitive' } },
        { state: { contains: city, mode: 'insensitive' } },
      ],
    },
  });
  
  // Retornar HSP encontrado o valor promedio nacional (5.0)
  return cityData?.hsp ?? 5.0;
}

/**
 * Calcula el tamaño del sistema necesario
 */
export function calculateSystemSize(
  monthlyKwh: number,
  hsp: number,
  systemLosses: number = 0.14
): number {
  // Fórmula: kWp = (kWh mensual) / (HSP * 30 días * (1 - pérdidas))
  const daysPerMonth = 30;
  const efficiency = 1 - systemLosses;
  
  return monthlyKwh / (hsp * daysPerMonth * efficiency);
}

/**
 * Calcula la generación anual esperada
 */
export function calculateAnnualGeneration(
  systemSizeKwp: number,
  hsp: number,
  systemLosses: number = 0.14
): number {
  const daysPerYear = 365;
  const efficiency = 1 - systemLosses;
  
  return systemSizeKwp * hsp * daysPerYear * efficiency;
}

/**
 * Calcula el número de paneles necesarios
 */
export function calculatePanelCount(
  systemSizeKwp: number,
  panelWatts: number
): number {
  return Math.ceil((systemSizeKwp * 1000) / panelWatts);
}

/**
 * Calcula el número de inversores necesarios
 */
export function calculateInverterCount(
  systemSizeKwp: number,
  inverterCapacityKw: number
): number {
  // Generalmente se sobredimensiona el arreglo 10-20% respecto al inversor
  const dcAcRatio = 1.15;
  return Math.ceil(systemSizeKwp / (inverterCapacityKw * dcAcRatio));
}

/**
 * Calcula el área de techo necesaria
 */
export function calculateRoofArea(
  numberOfPanels: number,
  panelAreaM2: number = 2.0 // Área promedio de panel 400W+
): number {
  // Añadir 20% para espaciado y acceso
  return numberOfPanels * panelAreaM2 * 1.2;
}

/**
 * Calcula el offset de CO2 y equivalente en árboles
 */
export function calculateEnvironmentalImpact(annualGenerationKwh: number): {
  co2OffsetTons: number;
  treesEquivalent: number;
} {
  // Factor de emisión promedio en México: 0.527 kg CO2 por kWh
  const co2FactorKgPerKwh = 0.527;
  const co2OffsetKg = annualGenerationKwh * co2FactorKgPerKwh;
  const co2OffsetTons = co2OffsetKg / 1000;
  
  // Un árbol absorbe aproximadamente 22 kg CO2 por año
  const treesEquivalent = Math.round(co2OffsetKg / 22);
  
  return { co2OffsetTons, treesEquivalent };
}

/**
 * Calcula ahorros a 25 años con degradación
 */
export function calculateLifetimeSavings(
  annualSavings: number,
  degradationRate: number = 0.005, // 0.5% anual
  years: number = 25
): number {
  let totalSavings = 0;
  let currentYearSavings = annualSavings;
  
  for (let year = 1; year <= years; year++) {
    totalSavings += currentYearSavings;
    currentYearSavings *= (1 - degradationRate);
  }
  
  return totalSavings;
}

// =====================================================
// FUNCIÓN PRINCIPAL DE CÁLCULO
// =====================================================

export async function calculateSolarSystem(
  consumption: ConsumptionData,
  location: LocationData,
  config: SystemConfig
): Promise<CalculationResult> {
  // 1. Obtener HSP de la ubicación
  const hsp = location.customHSP || await getHSPForCity(location.city);
  
  // 2. Obtener panel e inversor del catálogo
  const panelFromDB = await prisma.panelCatalog.findFirst({
    where: config.panelId ? { id: config.panelId } : { isActive: true },
    orderBy: { power: 'desc' },
  });
  
  const inverterFromDB = await prisma.inverterCatalog.findFirst({
    where: config.inverterId ? { id: config.inverterId } : { isActive: true },
    orderBy: { power: 'desc' },
  });
  
  // Valores por defecto si no hay catálogo
  const selectedPanel = panelFromDB ?? {
    id: 'default',
    brand: 'Canadian Solar',
    model: 'CS6R-550MS',
    power: 550,
    efficiency: 21.5,
    warranty: 25,
    price: 3200,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const selectedInverter = inverterFromDB ?? {
    id: 'default',
    brand: 'Huawei',
    model: 'SUN2000-5KTL-M1',
    power: 5,
    phases: 1,
    warranty: 10,
    price: 18000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // 3. Parámetros de cálculo
  const systemLosses = config.systemLosses ?? 0.14;
  const degradationRate = config.degradationRate ?? 0.005;
  const marginPercentage = config.marginPercentage ?? 0.25;
  
  // 4. Dimensionamiento del sistema
  const systemSizeKwp = calculateSystemSize(consumption.monthlyKwh, hsp, systemLosses);
  const panelWatts = selectedPanel.power; // power está en Watts para paneles
  const inverterKw = selectedInverter.power; // power está en kW para inversores
  const numberOfPanels = calculatePanelCount(systemSizeKwp, panelWatts);
  const actualSystemSizeKwp = (numberOfPanels * panelWatts) / 1000;
  const numberOfInverters = calculateInverterCount(actualSystemSizeKwp, inverterKw);
  const roofAreaM2 = calculateRoofArea(numberOfPanels);
  
  // 5. Generación esperada
  const annualGenerationKwh = calculateAnnualGeneration(actualSystemSizeKwp, hsp, systemLosses);
  const monthlyGenerationKwh = annualGenerationKwh / 12;
  
  // 6. Cálculo de costos
  const systemWatts = actualSystemSizeKwp * 1000;
  const panelsCost = numberOfPanels * selectedPanel.price;
  const invertersCost = numberOfInverters * selectedInverter.price;
  const installationCostPerWatt = INSTALLATION_COSTS[config.installationType] || INSTALLATION_COSTS['ROOF'];
  const installationCost = systemWatts * installationCostPerWatt;
  const structureCost = systemWatts * 1.5; // $1.5 MXN por watt
  const electricalMaterialsCost = systemWatts * 2.0; // $2.0 MXN por watt
  const laborCost = systemWatts * 1.0; // $1.0 MXN por watt
  
  const subtotal = panelsCost + invertersCost + installationCost + structureCost + electricalMaterialsCost + laborCost;
  const margin = subtotal * marginPercentage;
  const totalBeforeTax = subtotal + margin;
  const iva = totalBeforeTax * 0.16;
  const totalPrice = totalBeforeTax + iva;
  const pricePerWatt = totalPrice / systemWatts;
  
  // 7. Cálculo de tarifas y ahorros
  const tariffRate = calculateEffectiveTariffRate(consumption.monthlyKwh, consumption.cfeTariff);
  const monthlyBillBefore = calculateMonthlyBill(consumption.monthlyKwh, consumption.cfeTariff);
  
  // Consumo residual después de generación solar
  const residualMonthlyKwh = Math.max(0, consumption.monthlyKwh - monthlyGenerationKwh);
  
  // Calcular recibo después de solar
  let monthlyBillAfter = 0;
  if (residualMonthlyKwh > 0) {
    monthlyBillAfter = calculateMonthlyBill(residualMonthlyKwh, consumption.cfeTariff);
  } else {
    // Si no hay residual, aplicar mínimo de CFE
    // Para tarifas domésticas: ~$50 MXN (cargo administrativo)
    // Para industriales: cargo fijo de la tarifa
    if (consumption.cfeTariff === 'GDMTH') {
      monthlyBillAfter = GDMTH_FIXED_CHARGE;
    } else if (consumption.cfeTariff === 'GDMTO') {
      monthlyBillAfter = GDMTO_FIXED_CHARGE;
    } else {
      monthlyBillAfter = 50; // Mínimo para tarifas domésticas
    }
  }
  
  const monthlySavings = monthlyBillBefore - monthlyBillAfter;
  const annualSavings = monthlySavings * 12;
  // Cobertura del consumo (no del costo), que es lo que importa para ROI
  const consumptionCoveragePercent = (monthlyGenerationKwh / consumption.monthlyKwh) * 100;
  // Porcentaje de ahorro económico (puede diferir de cobertura por tarifas progresivas)
  const savingsPercentage = (monthlySavings / Math.max(1, monthlyBillBefore)) * 100;
  
  // DEBUG: Log para verificar cálculos
  console.log(`
    === CÁLCULO SOLAR ===
    Consumo: ${consumption.monthlyKwh} kWh/mes
    HSP: ${hsp}
    Generación esperada: ${Math.round(monthlyGenerationKwh)} kWh/mes
    Cobertura: ${consumptionCoveragePercent.toFixed(1)}%
    Residual: ${Math.round(residualMonthlyKwh)} kWh/mes
    Recibo actual: $${Math.round(monthlyBillBefore)}
    Recibo con solar: $${Math.round(monthlyBillAfter)}
    Ahorro mensual: $${Math.round(monthlySavings)}
  `);
  
  // 8. ROI y payback
  // Payback = Inversión / Ahorros Mensuales (en meses)
  // O equivalentemente: Inversión / Ahorros Anuales (en años) × 12
  const paybackMonths = subtotal / monthlySavings;
  const paybackYears = paybackMonths / 12;
  const lifetimeSavings = calculateLifetimeSavings(annualSavings, degradationRate, 25);
  const roi25Years = ((lifetimeSavings - subtotal) / subtotal) * 100;
  
  // DEBUG: Log para verificar ROI
  console.log(`
    === ROI CALCULATION ===
    Subtotal (Cost): $${Math.round(subtotal)}
    Total Price (with IVA): $${Math.round(totalPrice)}
    Monthly Savings: $${Math.round(monthlySavings)}
    Annual Savings: $${Math.round(annualSavings)}
    Payback Months: ${paybackMonths.toFixed(2)}
    Payback Years: ${paybackYears.toFixed(2)}
  `);
  
  // 9. Impacto ambiental
  const { co2OffsetTons, treesEquivalent } = calculateEnvironmentalImpact(annualGenerationKwh);
  
  return {
    // Dimensionamiento
    systemSizeKwp: Math.round(actualSystemSizeKwp * 100) / 100,
    numberOfPanels,
    numberOfInverters,
    roofAreaM2: Math.round(roofAreaM2 * 10) / 10,
    annualGenerationKwh: Math.round(annualGenerationKwh),
    monthlyGenerationKwh: Math.round(monthlyGenerationKwh),
    
    // Equipos
    panel: {
      id: selectedPanel.id,
      brand: selectedPanel.brand,
      model: selectedPanel.model,
      watts: panelWatts,
      price: selectedPanel.price,
    },
    inverter: {
      id: selectedInverter.id,
      brand: selectedInverter.brand,
      model: selectedInverter.model,
      capacityKw: inverterKw,
      price: selectedInverter.price,
    },
    
    // Costos
    panelsCost: Math.round(panelsCost),
    invertersCost: Math.round(invertersCost),
    installationCost: Math.round(installationCost),
    structureCost: Math.round(structureCost),
    electricalMaterialsCost: Math.round(electricalMaterialsCost),
    laborCost: Math.round(laborCost),
    subtotal: Math.round(subtotal),
    margin: Math.round(margin),
    totalBeforeTax: Math.round(totalBeforeTax),
    iva: Math.round(iva),
    totalPrice: Math.round(totalPrice),
    pricePerWatt: Math.round(pricePerWatt * 100) / 100,
    
    // Ahorros
    monthlyBillBefore: Math.round(monthlyBillBefore),
    monthlyBillAfter: Math.round(monthlyBillAfter),
    monthlySavings: Math.round(monthlySavings),
    annualSavings: Math.round(annualSavings),
    savingsPercentage: Math.round(savingsPercentage),
    consumptionCoveragePercent: Math.round(consumptionCoveragePercent * 10) / 10,
    paybackYears: Math.round(paybackYears * 10) / 10,
    roi25Years: Math.round(roi25Years),
    lifetimeSavings: Math.round(lifetimeSavings),
    
    // Datos CFE
    cfeTariff: consumption.cfeTariff,
    tariffRate: Math.round(tariffRate * 100) / 100,
    hsp,
    
    // Ambiental
    co2OffsetTons: Math.round(co2OffsetTons * 10) / 10,
    treesEquivalent,
  };
}

// =====================================================
// FUNCIONES DE CONSULTA DE CATÁLOGOS
// =====================================================

export async function getAvailablePanels() {
  return prisma.panelCatalog.findMany({
    where: { isActive: true },
    orderBy: { power: 'desc' },
  });
}

export async function getAvailableInverters() {
  return prisma.inverterCatalog.findMany({
    where: { isActive: true },
    orderBy: { power: 'desc' },
  });
}

export async function getCitiesWithHSP() {
  return prisma.cityHSP.findMany({
    orderBy: [{ state: 'asc' }, { city: 'asc' }],
  });
}

export async function getSystemConfig() {
  const config = await prisma.systemConfig.findFirst();
  return config || {
    defaultMargin: 0.25,
    ivaRate: 0.16,
    systemLosses: 0.14,
    degradationRate: 0.005,
  };
}
