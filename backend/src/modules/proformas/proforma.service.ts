import prisma from '../../config/database';
import { 
  CreateProformaInput, 
  UpdateProformaInput, 
  SignProformaInput,
  ListProformasInput,
  PaymentPlanItem 
} from './proforma.schema';

// =====================================================
// PROFORMA SERVICE
// =====================================================

// Términos y condiciones por defecto
const DEFAULT_TERMS = `
TÉRMINOS Y CONDICIONES

1. FORMA DE PAGO
   - Anticipo (50%): Se requiere para iniciar el proyecto
   - Materiales (30%): Al momento de entregar los materiales en sitio
   - Finiquito (20%): Al terminar la instalación y puesta en marcha

2. TIEMPO DE ENTREGA
   - El proyecto se ejecutará en un plazo de 2-4 semanas a partir de la recepción del anticipo
   - El tiempo puede variar según disponibilidad de materiales y condiciones del sitio

3. GARANTÍAS
   - Paneles solares: 25 años de producción lineal
   - Inversor: 10-12 años según fabricante
   - Instalación y mano de obra: 5 años
   - Estructura: 10 años

4. INCLUYE
   - Diseño del sistema fotovoltaico
   - Suministro e instalación de equipos
   - Trámite ante CFE para interconexión
   - Capacitación al usuario
   - Monitoreo del sistema (1 año)

5. NO INCLUYE
   - Trabajos civiles o eléctricos adicionales fuera del alcance
   - Adecuaciones a la red eléctrica existente (si aplica)
   - Permisos municipales (si aplican)

6. VALIDEZ DE LA PROPUESTA
   - Esta propuesta tiene una validez de 15 días naturales
   - Los precios pueden variar por fluctuaciones del mercado

7. CANCELACIÓN
   - En caso de cancelación se retendrá el 10% del anticipo como gastos administrativos
   - No hay reembolso una vez iniciados los trabajos

Al firmar este documento, el cliente acepta los términos y condiciones aquí descritos.
`.trim();

// Generar número de proforma
async function generateProformaNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PRE-${year}-`;
  
  const lastProforma = await prisma.proforma.findFirst({
    where: {
      proformaNumber: { startsWith: prefix },
    },
    orderBy: { proformaNumber: 'desc' },
  });
  
  let nextNumber = 1;
  if (lastProforma) {
    const lastNumber = parseInt(lastProforma.proformaNumber.split('-').pop() || '0');
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
}

// Generar plan de pagos por defecto (50-30-20)
function generateDefaultPaymentPlan(total: number): PaymentPlanItem[] {
  return [
    {
      phase: 'ANTICIPO',
      label: 'Anticipo (50%)',
      percent: 50,
      amount: Math.round(total * 0.5 * 100) / 100,
    },
    {
      phase: 'MATERIALES',
      label: 'Materiales (30%)',
      percent: 30,
      amount: Math.round(total * 0.3 * 100) / 100,
    },
    {
      phase: 'FINIQUITO',
      label: 'Finiquito (20%)',
      percent: 20,
      amount: Math.round(total * 0.2 * 100) / 100,
    },
  ];
}

// Crear proforma desde cotización aprobada
export async function createProforma(input: CreateProformaInput) {
  // Obtener la cotización
  const quotation = await prisma.quotation.findUnique({
    where: { id: input.quotationId },
    include: { client: true },
  });
  
  if (!quotation) {
    throw new Error('Cotización no encontrada');
  }
  
  // Verificar que la cotización esté aprobada
  if (quotation.status !== 'APPROVED') {
    throw new Error('Solo se pueden crear proformas de cotizaciones aprobadas');
  }
  
  // Verificar que no exista ya una proforma para esta cotización
  const existingProforma = await prisma.proforma.findUnique({
    where: { quotationId: input.quotationId },
    include: {
      quotation: {
        select: {
          quoteNumber: true,
          systemSize: true,
          panelsQty: true,
          panelBrand: true,
          panelModel: true,
          inverterBrand: true,
          inverterModel: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
        },
      },
    },
  });
  
  // Si ya existe, devolver la proforma existente (idempotente)
  if (existingProforma) {
    return { ...existingProforma, alreadyExisted: true };
  }
  
  // Calcular montos
  const subtotal = quotation.salePrice;
  const iva = Math.round(subtotal * 0.16 * 100) / 100;
  const total = subtotal + iva;
  
  // Generar número de proforma
  const proformaNumber = await generateProformaNumber();
  
  // Plan de pagos
  const paymentPlan = input.paymentPlan || generateDefaultPaymentPlan(total);
  
  // Validez: 15 días por defecto
  const validUntil = input.validUntil 
    ? new Date(input.validUntil) 
    : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  
  // Crear la proforma
  const proforma = await prisma.proforma.create({
    data: {
      proformaNumber,
      quotation: { connect: { id: input.quotationId } },
      client: { connect: { id: quotation.clientId } },
      subtotal,
      iva,
      total,
      paymentPlan: paymentPlan as any,
      termsConditions: input.termsConditions || DEFAULT_TERMS,
      notes: input.notes,
      validUntil,
    },
    include: {
      quotation: {
        select: {
          quoteNumber: true,
          systemSize: true,
          panelsQty: true,
          panelBrand: true,
          panelModel: true,
          inverterBrand: true,
          inverterModel: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
        },
      },
    },
  });
  
  return proforma;
}

// Obtener proforma por ID
export async function getProformaById(id: string) {
  const proforma = await prisma.proforma.findUnique({
    where: { id },
    include: {
      quotation: {
        select: {
          id: true,
          quoteNumber: true,
          systemSize: true,
          panelsQty: true,
          panelBrand: true,
          panelModel: true,
          panelPower: true,
          inverterBrand: true,
          inverterModel: true,
          inverterPower: true,
          monthlyProduction: true,
          annualProduction: true,
          monthlySavings: true,
          annualSavings: true,
          paybackYears: true,
          roi25Years: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      client: true,
      project: {
        select: {
          id: true,
          projectNumber: true,
          status: true,
        },
      },
    },
  });
  
  return proforma;
}

// Listar proformas
export async function listProformas(input: ListProformasInput) {
  const { page, limit, status, clientId, search } = input;
  const skip = (page - 1) * limit;
  
  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  if (clientId) {
    where.clientId = clientId;
  }
  
  if (search) {
    where.OR = [
      { proformaNumber: { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
      { client: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }
  
  const [proformas, total] = await Promise.all([
    prisma.proforma.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        quotation: {
          select: {
            quoteNumber: true,
            systemSize: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        project: {
          select: {
            id: true,
            projectNumber: true,
            status: true,
          },
        },
      },
    }),
    prisma.proforma.count({ where }),
  ]);
  
  return {
    data: proformas,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Actualizar proforma
export async function updateProforma(id: string, input: UpdateProformaInput) {
  const proforma = await prisma.proforma.findUnique({
    where: { id },
  });
  
  if (!proforma) {
    throw new Error('Proforma no encontrada');
  }
  
  // No se puede editar una proforma firmada
  if (proforma.status === 'SIGNED') {
    throw new Error('No se puede editar una proforma firmada');
  }
  
  const updateData: any = {};
  
  if (input.paymentPlan) {
    // Recalcular montos si cambia el plan
    const total = proforma.total;
    const totalPercent = input.paymentPlan.reduce((sum, p) => sum + p.percent, 0);
    
    if (totalPercent !== 100) {
      throw new Error('Los porcentajes del plan de pagos deben sumar 100%');
    }
    
    // Recalcular montos
    const paymentPlan = input.paymentPlan.map(p => ({
      ...p,
      amount: Math.round(total * (p.percent / 100) * 100) / 100,
    }));
    
    updateData.paymentPlan = paymentPlan;
  }
  
  if (input.termsConditions !== undefined) {
    updateData.termsConditions = input.termsConditions;
  }
  
  if (input.notes !== undefined) {
    updateData.notes = input.notes;
  }
  
  if (input.validUntil) {
    updateData.validUntil = new Date(input.validUntil);
  }
  
  const updated = await prisma.proforma.update({
    where: { id },
    data: updateData,
    include: {
      quotation: {
        select: { quoteNumber: true, systemSize: true },
      },
      client: {
        select: { id: true, name: true, email: true },
      },
    },
  });
  
  return updated;
}

// Enviar proforma
export async function sendProforma(id: string) {
  const proforma = await prisma.proforma.findUnique({
    where: { id },
  });
  
  if (!proforma) {
    throw new Error('Proforma no encontrada');
  }
  
  if (proforma.status === 'SIGNED') {
    throw new Error('Esta proforma ya está firmada');
  }
  
  const updated = await prisma.proforma.update({
    where: { id },
    data: {
      status: 'SENT',
      sentAt: new Date(),
    },
    include: {
      client: true,
      quotation: {
        select: { quoteNumber: true },
      },
    },
  });
  
  return updated;
}

// Marcar como vista
export async function markProformaAsViewed(id: string) {
  const proforma = await prisma.proforma.update({
    where: { id },
    data: {
      status: 'PENDING_SIGNATURE',
      viewedAt: new Date(),
    },
  });
  
  return proforma;
}

// Firmar proforma
export async function signProforma(id: string, input: SignProformaInput) {
  const proforma = await prisma.proforma.findUnique({
    where: { id },
    include: {
      quotation: true,
      client: true,
    },
  });
  
  if (!proforma) {
    throw new Error('Proforma no encontrada');
  }
  
  if (proforma.status === 'SIGNED') {
    throw new Error('Esta proforma ya está firmada');
  }
  
  if (proforma.status === 'CANCELLED') {
    throw new Error('Esta proforma está cancelada');
  }
  
  // Actualizar proforma con firma
  const signed = await prisma.proforma.update({
    where: { id },
    data: {
      status: 'SIGNED',
      signatureImage: input.signatureImage,
      signedByName: input.signedByName,
      signedByEmail: input.signedByEmail,
      signedAt: new Date(),
    },
    include: {
      quotation: {
        select: {
          id: true,
          quoteNumber: true,
          systemSize: true,
          panelsQty: true,
        },
      },
      client: true,
    },
  });
  
  return signed;
}

// Cancelar proforma
export async function cancelProforma(id: string, reason?: string) {
  const proforma = await prisma.proforma.findUnique({
    where: { id },
    include: { project: true },
  });
  
  if (!proforma) {
    throw new Error('Proforma no encontrada');
  }
  
  if (proforma.project) {
    throw new Error('No se puede cancelar una proforma con proyecto asociado');
  }
  
  if (proforma.status === 'SIGNED') {
    throw new Error('No se puede cancelar una proforma firmada');
  }
  
  const cancelled = await prisma.proforma.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      notes: reason ? `${proforma.notes || ''}\n\n[CANCELACIÓN]: ${reason}`.trim() : proforma.notes,
    },
  });
  
  return cancelled;
}

// Obtener estadísticas de proformas
export async function getProformaStats() {
  const [
    total,
    draft,
    sent,
    pendingSignature,
    signed,
    cancelled,
    totalAmount,
    signedAmount,
  ] = await Promise.all([
    prisma.proforma.count(),
    prisma.proforma.count({ where: { status: 'DRAFT' } }),
    prisma.proforma.count({ where: { status: 'SENT' } }),
    prisma.proforma.count({ where: { status: 'PENDING_SIGNATURE' } }),
    prisma.proforma.count({ where: { status: 'SIGNED' } }),
    prisma.proforma.count({ where: { status: 'CANCELLED' } }),
    prisma.proforma.aggregate({
      _sum: { total: true },
    }),
    prisma.proforma.aggregate({
      where: { status: 'SIGNED' },
      _sum: { total: true },
    }),
  ]);
  
  const conversionRate = total > 0 ? (signed / total) * 100 : 0;
  
  return {
    total,
    byStatus: {
      draft,
      sent,
      pendingSignature,
      signed,
      cancelled,
    },
    totalAmount: totalAmount._sum.total || 0,
    signedAmount: signedAmount._sum.total || 0,
    conversionRate: Math.round(conversionRate * 10) / 10,
  };
}
