import prisma from '../../config/database';
import { 
  CreateProjectInput, 
  UpdateProjectInput, 
  ListProjectsInput,
  RegisterPaymentInput,
  UpdatePaymentInput,
} from './project.schema';
import { PaymentPhase, PaymentStatus } from '@prisma/client';

// =====================================================
// PROJECT SERVICE
// =====================================================

// Generar número de proyecto
async function generateProjectNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PROJ-${year}-`;
  
  const lastProject = await prisma.project.findFirst({
    where: {
      projectNumber: { startsWith: prefix },
    },
    orderBy: { projectNumber: 'desc' },
  });
  
  let nextNumber = 1;
  if (lastProject) {
    const lastNumber = parseInt(lastProject.projectNumber.split('-').pop() || '0');
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
}

// Crear proyecto desde proforma firmada
export async function createProject(input: CreateProjectInput) {
  // Obtener la proforma con sus datos
  const proforma = await prisma.proforma.findUnique({
    where: { id: input.proformaId },
    include: {
      quotation: true,
      client: true,
      project: true,
    },
  });
  
  if (!proforma) {
    throw new Error('Proforma no encontrada');
  }
  
  // Verificar que la proforma esté firmada
  if (proforma.status !== 'SIGNED') {
    throw new Error('Solo se pueden crear proyectos de proformas firmadas');
  }
  
  // Verificar que no exista ya un proyecto
  if (proforma.project) {
    throw new Error('Ya existe un proyecto para esta proforma');
  }
  
  const projectNumber = await generateProjectNumber();
  const paymentPlan = proforma.paymentPlan as any[];
  
  // Crear proyecto con transacción
  const project = await prisma.$transaction(async (tx) => {
    // Crear el proyecto
    const newProject = await tx.project.create({
      data: {
        projectNumber,
        quotation: { connect: { id: proforma.quotationId } },
        proforma: { connect: { id: proforma.id } },
        client: { connect: { id: proforma.clientId } },
        assignedTo: input.assignedToId ? { connect: { id: input.assignedToId } } : undefined,
        systemSize: proforma.quotation.systemSize,
        panelsQty: proforma.quotation.panelsQty,
        totalAmount: proforma.total,
        pendingAmount: proforma.total,
        paidAmount: 0,
        estimatedEndDate: input.estimatedEndDate ? new Date(input.estimatedEndDate) : null,
        installationAddress: input.installationAddress || proforma.client.address,
        notes: input.notes,
      },
    });
    
    // Crear los pagos según el plan de pagos
    const payments = await Promise.all(
      paymentPlan.map(async (plan: any) => {
        const phase = plan.phase as PaymentPhase;
        return tx.payment.create({
          data: {
            project: { connect: { id: newProject.id } },
            phase,
            phaseLabel: plan.label,
            expectedAmount: plan.amount,
            paidAmount: 0,
            status: 'PENDING' as PaymentStatus,
          },
        });
      })
    );
    
    return {
      ...newProject,
      payments,
    };
  });
  
  // Obtener proyecto completo
  return getProjectById(project.id);
}

// Obtener proyecto por ID
export async function getProjectById(id: string) {
  const project = await prisma.project.findUnique({
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
          monthlySavings: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      proforma: {
        select: {
          id: true,
          proformaNumber: true,
          signedAt: true,
          signedByName: true,
        },
      },
      client: true,
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      payments: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  
  return project;
}

// Listar proyectos
export async function listProjects(input: ListProjectsInput) {
  const { page, limit, status, clientId, assignedToId, search } = input;
  const skip = (page - 1) * limit;
  
  const where: any = {};
  
  if (status) {
    where.status = status;
  }
  
  if (clientId) {
    where.clientId = clientId;
  }
  
  if (assignedToId) {
    where.assignedToId = assignedToId;
  }
  
  if (search) {
    where.OR = [
      { projectNumber: { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
      { client: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }
  
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
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
        proforma: {
          select: {
            proformaNumber: true,
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
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          select: {
            id: true,
            phase: true,
            phaseLabel: true,
            expectedAmount: true,
            paidAmount: true,
            status: true,
          },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);
  
  return {
    data: projects,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Actualizar proyecto
export async function updateProject(id: string, input: UpdateProjectInput) {
  const project = await prisma.project.findUnique({
    where: { id },
  });
  
  if (!project) {
    throw new Error('Proyecto no encontrado');
  }
  
  const updateData: any = {};
  
  if (input.status) {
    updateData.status = input.status;
  }
  
  if (input.assignedToId !== undefined) {
    updateData.assignedTo = input.assignedToId 
      ? { connect: { id: input.assignedToId } }
      : { disconnect: true };
  }
  
  if (input.startDate) {
    updateData.startDate = new Date(input.startDate);
  }
  
  if (input.estimatedEndDate) {
    updateData.estimatedEndDate = new Date(input.estimatedEndDate);
  }
  
  if (input.actualEndDate) {
    updateData.actualEndDate = new Date(input.actualEndDate);
  }
  
  if (input.cfeApprovalDate) {
    updateData.cfeApprovalDate = new Date(input.cfeApprovalDate);
  }
  
  if (input.interconnectionDate) {
    updateData.interconnectionDate = new Date(input.interconnectionDate);
  }
  
  if (input.installationAddress !== undefined) {
    updateData.installationAddress = input.installationAddress;
  }
  
  if (input.notes !== undefined) {
    updateData.notes = input.notes;
  }
  
  if (input.documents) {
    updateData.documents = input.documents;
  }
  
  const updated = await prisma.project.update({
    where: { id },
    data: updateData,
    include: {
      quotation: {
        select: { quoteNumber: true, systemSize: true },
      },
      client: {
        select: { id: true, name: true, email: true },
      },
      assignedTo: {
        select: { id: true, name: true },
      },
      payments: true,
    },
  });
  
  return updated;
}

// Registrar pago
export async function registerPayment(input: RegisterPaymentInput) {
  const project = await prisma.project.findUnique({
    where: { id: input.projectId },
    include: { payments: true },
  });
  
  if (!project) {
    throw new Error('Proyecto no encontrado');
  }
  
  // Encontrar el pago de esta fase
  const payment = project.payments.find(p => p.phase === input.phase);
  
  if (!payment) {
    throw new Error(`No se encontró el pago de la fase ${input.phase}`);
  }
  
  const newPaidAmount = payment.paidAmount + input.amount;
  const isFullyPaid = newPaidAmount >= payment.expectedAmount;
  
  // Actualizar pago con transacción
  const result = await prisma.$transaction(async (tx) => {
    // Actualizar el pago
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        paidAmount: newPaidAmount,
        status: isFullyPaid ? 'PAID' : 'PARTIAL',
        paymentMethod: input.paymentMethod,
        reference: input.reference,
        notes: input.notes,
        receiptUrl: input.receiptUrl,
        paidAt: new Date(),
      },
    });
    
    // Actualizar el proyecto
    const newTotalPaid = project.paidAmount + input.amount;
    const newPending = project.totalAmount - newTotalPaid;
    
    // Determinar nuevo estado del proyecto
    let newStatus = project.status;
    if (input.phase === 'ANTICIPO' && project.status === 'PENDING_PAYMENT') {
      newStatus = 'IN_PROGRESS';
    }
    
    const updatedProject = await tx.project.update({
      where: { id: project.id },
      data: {
        paidAmount: newTotalPaid,
        pendingAmount: newPending,
        status: newStatus,
        startDate: project.startDate || (input.phase === 'ANTICIPO' ? new Date() : null),
      },
    });
    
    return { payment: updatedPayment, project: updatedProject };
  });
  
  return result;
}

// Obtener pagos de un proyecto
export async function getProjectPayments(projectId: string) {
  const payments = await prisma.payment.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });
  
  return payments;
}

// Actualizar pago individual
export async function updatePayment(paymentId: string, input: UpdatePaymentInput) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { project: true },
  });
  
  if (!payment) {
    throw new Error('Pago no encontrado');
  }
  
  const updateData: any = {};
  
  if (input.paidAmount !== undefined) {
    updateData.paidAmount = input.paidAmount;
  }
  
  if (input.status) {
    updateData.status = input.status;
  }
  
  if (input.paymentMethod !== undefined) {
    updateData.paymentMethod = input.paymentMethod;
  }
  
  if (input.reference !== undefined) {
    updateData.reference = input.reference;
  }
  
  if (input.notes !== undefined) {
    updateData.notes = input.notes;
  }
  
  if (input.receiptUrl !== undefined) {
    updateData.receiptUrl = input.receiptUrl;
  }
  
  if (input.paidAt) {
    updateData.paidAt = new Date(input.paidAt);
  }
  
  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: updateData,
  });
  
  // Recalcular totales del proyecto si cambió el monto
  if (input.paidAmount !== undefined) {
    const allPayments = await prisma.payment.findMany({
      where: { projectId: payment.projectId },
    });
    
    const totalPaid = allPayments.reduce((sum, p) => sum + p.paidAmount, 0);
    
    await prisma.project.update({
      where: { id: payment.projectId },
      data: {
        paidAmount: totalPaid,
        pendingAmount: payment.project.totalAmount - totalPaid,
      },
    });
  }
  
  return updated;
}

// Obtener estadísticas de proyectos
export async function getProjectStats() {
  const [
    total,
    pendingPayment,
    inProgress,
    cfeProcess,
    completed,
    cancelled,
    totalAmount,
    paidAmount,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: 'PENDING_PAYMENT' } }),
    prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.project.count({ where: { status: 'CFE_PROCESS' } }),
    prisma.project.count({ where: { status: 'COMPLETED' } }),
    prisma.project.count({ where: { status: 'CANCELLED' } }),
    prisma.project.aggregate({
      _sum: { totalAmount: true },
    }),
    prisma.project.aggregate({
      _sum: { paidAmount: true },
    }),
  ]);
  
  const completionRate = total > 0 ? (completed / total) * 100 : 0;
  
  return {
    total,
    byStatus: {
      pendingPayment,
      inProgress,
      cfeProcess,
      completed,
      cancelled,
    },
    totalAmount: totalAmount._sum.totalAmount || 0,
    paidAmount: paidAmount._sum.paidAmount || 0,
    pendingAmount: (totalAmount._sum.totalAmount || 0) - (paidAmount._sum.paidAmount || 0),
    completionRate: Math.round(completionRate * 10) / 10,
  };
}

// Cambiar estado de proyecto
export async function changeProjectStatus(id: string, status: string, notes?: string) {
  const project = await prisma.project.findUnique({
    where: { id },
  });
  
  if (!project) {
    throw new Error('Proyecto no encontrado');
  }
  
  const updateData: any = { status };
  
  // Agregar fechas según el estado
  if (status === 'IN_PROGRESS' && !project.startDate) {
    updateData.startDate = new Date();
  }
  
  if (status === 'COMPLETED') {
    updateData.actualEndDate = new Date();
  }
  
  if (notes) {
    updateData.notes = `${project.notes || ''}\n[${new Date().toISOString()}]: ${notes}`.trim();
  }
  
  const updated = await prisma.project.update({
    where: { id },
    data: updateData,
    include: {
      client: {
        select: { id: true, name: true, email: true },
      },
      payments: true,
    },
  });
  
  return updated;
}
