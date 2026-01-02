// =====================================================
// SERVICIO DE COTIZACIONES
// =====================================================

import { prisma } from '../../config/database';
import { 
  CreateQuotationInput, 
  UpdateQuotationInput, 
  QueryQuotationsInput,
  CalculateQuotationInput,
} from './quotation.schema';
import { 
  calculateSolarSystem,
  ConsumptionData,
  LocationData,
  SystemConfig,
  CalculationResult,
} from '../calculator/solar-calculator.service';
import { AppError } from '../../shared/errors/AppError';

// =====================================================
// CONSTANTE DE COSTO POR PANEL
// =====================================================

const COST_PER_PANEL = 8500; // MXN - Incluye material + mano de obra

// =====================================================
// GENERAR NÚMERO DE COTIZACIÓN
// =====================================================

async function generateQuotationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day = String(new Date().getDate()).padStart(2, '0');
  
  // Generar un ID único con timestamp y random para evitar duplicados
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  return `QUOT-${year}${month}${day}-${timestamp}${randomSuffix}`;
}

// =====================================================
// CALCULAR COTIZACIÓN (SIN GUARDAR)
// =====================================================

export async function calculateQuotation(
  input: CalculateQuotationInput
): Promise<CalculationResult> {
  const consumption: ConsumptionData = {
    monthlyKwh: input.monthlyKwh,
    bimonthlyBill: input.bimonthlyBill,
    cfeTariff: input.cfeTariff,
  };
  
  const location: LocationData = {
    city: input.city,
    state: input.state,
    customHSP: input.customHSP,
  };
  
  const config: SystemConfig = {
    panelId: input.panelId,
    inverterId: input.inverterId,
    installationType: input.installationType,
    systemLosses: input.systemLosses,
    marginPercentage: input.marginPercentage,
  };
  
  return calculateSolarSystem(consumption, location, config);
}

// =====================================================
// CREAR COTIZACIÓN
// =====================================================

export async function createQuotation(
  input: CreateQuotationInput,
  createdById: string
) {
  // Verificar que el cliente existe
  const client = await prisma.client.findUnique({
    where: { id: input.clientId },
  });
  
  if (!client) {
    throw new AppError(404, 'Cliente no encontrado');
  }
  
  // Calcular el sistema
  const calculation = await calculateQuotation({
    monthlyKwh: input.monthlyKwh,
    bimonthlyBill: input.bimonthlyBill,
    cfeTariff: input.cfeTariff,
    city: input.city,
    state: input.state,
    panelId: input.panelId,
    inverterId: input.inverterId,
    installationType: input.installationType,
  });
  
  // Generar número de cotización
  const quoteNumber = await generateQuotationNumber();
  
  // Calcular costo de paneles con precio unitario
  const costPerPanel = COST_PER_PANEL;
  const totalPanelsCost = calculation.numberOfPanels * costPerPanel;
  
  // Aplicar descuento si existe
  const discountPercentage = input.discount || 0;
  const discountAmount = calculation.totalPrice * (discountPercentage / 100);
  const finalPrice = calculation.totalPrice - discountAmount;
  
  // Validez por defecto: 15 días
  const validUntil = input.validUntil 
    ? new Date(input.validUntil)
    : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  
  // Mapear tarifa CFE a enum
  const tariffMap: Record<string, any> = {
    'T1': 'T1',
    'T1A': 'T1A', 
    'T1B': 'T1B',
    'T1C': 'T1C',
    'T1D': 'T1D',
    'T1E': 'T1E',
    'T1F': 'T1F',
    'DAC': 'DAC',
  };
  
  // Crear cotización con campos del schema actual
  const quotation = await prisma.quotation.create({
    data: {
      quoteNumber,
      client: { connect: { id: input.clientId } },
      createdBy: { connect: { id: createdById } },
      
      // Consumo
      monthlyConsumption: input.monthlyKwh,
      avgBill: input.bimonthlyBill || calculation.monthlyBillBefore,
      tariff: tariffMap[input.cfeTariff] || 'T1',
      
      // Sistema
      systemSize: calculation.systemSizeKwp,
      panelsQty: calculation.numberOfPanels,
      panelBrand: calculation.panel.brand,
      panelModel: calculation.panel.model,
      panelPower: calculation.panel.watts,
      inverterBrand: calculation.inverter.brand,
      inverterModel: calculation.inverter.model,
      inverterPower: calculation.inverter.capacityKw,
      structureType: input.installationType,
      
      // Producción
      monthlyProduction: calculation.monthlyGenerationKwh,
      annualProduction: calculation.annualGenerationKwh,
      coveragePercent: calculation.consumptionCoveragePercent,
      hspUsed: calculation.hsp,
      
      // Financiero
      realCost: calculation.subtotal,
      salePrice: finalPrice,
      discount: discountAmount,
      profitAmount: calculation.margin,
      profitMargin: 25, // Porcentaje de margen
      
      // Desglose de costos
      costBreakdown: {
        costPerPanel,
        panelsQuantity: calculation.numberOfPanels,
        totalPanelsCost,
        panels: calculation.panelsCost,
        inverter: calculation.invertersCost,
        installation: calculation.installationCost,
        structure: calculation.structureCost,
        electrical: calculation.electricalMaterialsCost,
        labor: calculation.laborCost,
        iva: calculation.iva,
      },
      
      // Ahorros
      monthlySavings: calculation.monthlySavings,
      monthlyBillAfter: calculation.monthlyBillAfter,
      annualSavings: calculation.annualSavings,
      paybackYears: calculation.paybackYears,
      roi25Years: calculation.roi25Years,
      
      // Metadata
      notes: input.internalNotes,
      clientNotes: input.notes,
      validUntil,
      status: 'DRAFT',
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  
  return quotation;
}

// =====================================================
// OBTENER COTIZACIONES (PAGINADO)
// =====================================================

export async function getQuotations(query: QueryQuotationsInput) {
  const {
    page,
    limit,
    search,
    status,
    clientId,
    createdById,
    fromDate,
    toDate,
    minAmount,
    maxAmount,
    sortBy,
    sortOrder,
  } = query;
  
  const skip = (page - 1) * limit;
  
  // Construir filtros
  const where: any = {};
  
  if (search) {
    where.OR = [
      { quoteNumber: { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
      { client: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }
  
  if (status) {
    where.status = status;
  }
  
  if (clientId) {
    where.clientId = clientId;
  }
  
  if (createdById) {
    where.createdById = createdById;
  }
  
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = new Date(fromDate);
    if (toDate) where.createdAt.lte = new Date(toDate);
  }
  
  if (minAmount || maxAmount) {
    where.salePrice = {};
    if (minAmount) where.salePrice.gte = minAmount;
    if (maxAmount) where.salePrice.lte = maxAmount;
  }
  
  // Mapear sortBy a campo de BD
  const orderByField = {
    createdAt: 'createdAt',
    totalPrice: 'salePrice',
    systemSize: 'systemSize',
    status: 'status',
  }[sortBy] || 'createdAt';
  
  const [quotations, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [orderByField]: sortOrder },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.quotation.count({ where }),
  ]);
  
  return {
    data: quotations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// =====================================================
// OBTENER COTIZACIÓN POR ID
// =====================================================

export async function getQuotationById(id: string) {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      client: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });
  
  if (!quotation) {
    throw new AppError(404, 'Cotización no encontrada');
  }
  
  return quotation;
}

// =====================================================
// ACTUALIZAR COTIZACIÓN
// =====================================================

export async function updateQuotation(
  id: string,
  input: UpdateQuotationInput
) {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
  });
  
  if (!quotation) {
    throw new AppError(404, 'Cotización no encontrada');
  }
  
  // Preparar datos de actualización
  const updateData: any = {};

  if (input.status) {
    updateData.status = input.status;
    // Actualizar fechas según status
    if (input.status === 'SENT') {
      updateData.sentAt = new Date();
    } else if (input.status === 'APPROVED') {
      updateData.approvedAt = new Date();
    } else if (input.status === 'REJECTED') {
      updateData.rejectedAt = new Date();
    }
  }

  if (input.notes !== undefined) {
    updateData.notes = input.notes;
  }
  if (input.internalNotes !== undefined) {
    updateData.clientNotes = input.internalNotes;
  }
  if (input.discount !== undefined) {
    updateData.discount = input.discount;
    // Opcional: recalcular salePrice si es necesario
  }
  if (input.validUntil) {
    updateData.validUntil = new Date(input.validUntil);
  }

  // Solo campos válidos del modelo Quotation
  if (input.monthlyConsumption !== undefined) updateData.monthlyConsumption = input.monthlyConsumption;
  if (input.avgBill !== undefined) updateData.avgBill = input.avgBill;
  if (input.tariff !== undefined) updateData.tariff = input.tariff;
  if (input.systemSize !== undefined) updateData.systemSize = input.systemSize;
  if (input.panelsQty !== undefined) updateData.panelsQty = input.panelsQty;
  if (input.monthlyProduction !== undefined) updateData.monthlyProduction = input.monthlyProduction;
  if (input.annualProduction !== undefined) updateData.annualProduction = input.annualProduction;
  if (input.realCost !== undefined) updateData.realCost = input.realCost;
  if (input.salePrice !== undefined) updateData.salePrice = input.salePrice;
  if (input.monthlySavings !== undefined) updateData.monthlySavings = input.monthlySavings;
  if (input.annualSavings !== undefined) updateData.annualSavings = input.annualSavings;
  if (input.paybackYears !== undefined) updateData.paybackYears = input.paybackYears;
  if (input.roi25Years !== undefined) updateData.roi25Years = input.roi25Years;
  if (input.panelsCost !== undefined) updateData.panelsCost = input.panelsCost;
  if (input.invertersCost !== undefined) updateData.invertersCost = input.invertersCost;
  if (input.installationCost !== undefined) updateData.installationCost = input.installationCost;
  if (input.additionalCosts !== undefined) updateData.additionalCosts = input.additionalCosts;
  
  const updated = await prisma.quotation.update({
    where: { id },
    data: updateData,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  
  return updated;
}

// =====================================================
// ELIMINAR COTIZACIÓN
// =====================================================

export async function deleteQuotation(id: string) {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
  });
  
  if (!quotation) {
    throw new AppError(404, 'Cotización no encontrada');
  }
  
  await prisma.quotation.delete({
    where: { id },
  });
  
  return { message: 'Cotización eliminada correctamente' };
}

// =====================================================
// DUPLICAR COTIZACIÓN
// =====================================================

export async function duplicateQuotation(id: string, createdById: string) {
  const original = await prisma.quotation.findUnique({
    where: { id },
  });
  
  if (!original) {
    throw new AppError(404, 'Cotización no encontrada');
  }
  
  const quoteNumber = await generateQuotationNumber();
  const validUntil = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  
  // Excluir campos que no se deben copiar
  const { 
    id: _, 
    quoteNumber: __, 
    createdAt, 
    updatedAt, 
    status, 
    sentAt, 
    approvedAt,
    rejectedAt,
    viewedAt,
    pdfUrl,
    costBreakdown,
    ...quotationData 
  } = original;
  
  const duplicate = await prisma.quotation.create({
    data: {
      ...quotationData,
      quoteNumber,
      createdById,
      validUntil,
      status: 'DRAFT',
      costBreakdown: costBreakdown ?? undefined,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  
  return duplicate;
}

// =====================================================
// ESTADÍSTICAS DE COTIZACIONES
// =====================================================

export async function getQuotationStats(createdById?: string) {
  const where = createdById ? { createdById } : {};
  
  const [
    total,
    draft,
    sent,
    viewed,
    approved,
    rejected,
    expired,
    totalAmount,
    approvedAmount,
  ] = await Promise.all([
    prisma.quotation.count({ where }),
    prisma.quotation.count({ where: { ...where, status: 'DRAFT' } }),
    prisma.quotation.count({ where: { ...where, status: 'SENT' } }),
    prisma.quotation.count({ where: { ...where, status: 'VIEWED' } }),
    prisma.quotation.count({ where: { ...where, status: 'APPROVED' } }),
    prisma.quotation.count({ where: { ...where, status: 'REJECTED' } }),
    prisma.quotation.count({ where: { ...where, status: 'EXPIRED' } }),
    prisma.quotation.aggregate({
      where,
      _sum: { salePrice: true },
    }),
    prisma.quotation.aggregate({
      where: { ...where, status: 'APPROVED' },
      _sum: { salePrice: true },
    }),
  ]);
  
  const conversionRate = total > 0 ? (approved / total) * 100 : 0;
  
  return {
    total,
    byStatus: {
      draft,
      sent,
      viewed,
      approved,
      rejected,
      expired,
    },
    totalAmount: totalAmount._sum.salePrice || 0,
    approvedAmount: approvedAmount._sum.salePrice || 0,
    conversionRate: Math.round(conversionRate * 10) / 10,
  };
}
