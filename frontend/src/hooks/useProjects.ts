// =====================================================
// HOOKS DE PROYECTOS
// =====================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

// =====================================================
// TIPOS
// =====================================================

export interface Payment {
  id: string;
  projectId: string;
  phase: 'ANTICIPO' | 'MATERIALES' | 'FINIQUITO';
  phaseLabel: string;
  expectedAmount: number;
  paidAmount: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  dueDate?: string;
  paymentMethod?: string;
  reference?: string;
  receiptUrl?: string;
  notes?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  projectNumber: string;
  quotationId: string;
  proformaId: string;
  clientId: string;
  assignedToId?: string;
  status: 'PENDING_PAYMENT' | 'IN_PROGRESS' | 'CFE_PROCESS' | 'COMPLETED' | 'CANCELLED';
  systemSize: number;
  panelsQty: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  startDate?: string;
  estimatedEndDate?: string;
  actualEndDate?: string;
  cfeApprovalDate?: string;
  interconnectionDate?: string;
  installationAddress?: string;
  notes?: string;
  documents?: string[];
  createdAt: string;
  updatedAt: string;
  quotation: {
    id: string;
    quoteNumber: string;
    systemSize: number;
    panelsQty: number;
    panelBrand: string;
    panelModel: string;
    panelPower: number;
    inverterBrand: string;
    inverterModel: string;
    inverterPower: number;
    monthlyProduction: number;
    monthlySavings: number;
    createdBy?: {
      id: string;
      name: string;
      email: string;
    };
  };
  proforma: {
    id: string;
    proformaNumber: string;
    signedAt?: string;
    signedByName?: string;
  };
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  payments: Payment[];
}

export interface CreateProjectInput {
  proformaId: string;
  assignedToId?: string;
  estimatedEndDate?: string;
  installationAddress?: string;
  notes?: string;
}

export interface UpdateProjectInput {
  status?: string;
  assignedToId?: string;
  startDate?: string;
  estimatedEndDate?: string;
  actualEndDate?: string;
  cfeApprovalDate?: string;
  interconnectionDate?: string;
  installationAddress?: string;
  notes?: string;
  documents?: string[];
}

export interface RegisterPaymentInput {
  projectId: string;
  phase: 'ANTICIPO' | 'MATERIALES' | 'FINIQUITO';
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  receiptUrl?: string;
}

export interface ListProjectsParams {
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
  assignedToId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | null;
}

export interface ProjectStats {
  total: number;
  byStatus: {
    pendingPayment: number;
    inProgress: number;
    cfeProcess: number;
    completed: number;
    cancelled: number;
  };
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  completionRate: number;
}

// =====================================================
// QUERY KEYS
// =====================================================

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params: ListProjectsParams) => [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  payments: (projectId: string) => [...projectKeys.all, 'payments', projectId] as const,
  stats: () => [...projectKeys.all, 'stats'] as const,
};

// =====================================================
// HOOKS
// =====================================================

// Listar proyectos
export function useProjects(params: ListProjectsParams = {}) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get('/projects', { params });
      return data;
    },
  });
}

// Obtener proyecto por ID
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${id}`);
      return data.data as Project;
    },
    enabled: !!id,
  });
}

// Estadísticas de proyectos
export function useProjectStats() {
  return useQuery({
    queryKey: projectKeys.stats(),
    queryFn: async () => {
      const { data } = await api.get('/projects/stats');
      return data.data as ProjectStats;
    },
  });
}

// Obtener pagos de un proyecto
export function useProjectPayments(projectId: string) {
  return useQuery({
    queryKey: projectKeys.payments(projectId),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${projectId}/payments`);
      return data.data as Payment[];
    },
    enabled: !!projectId,
  });
}

// Crear proyecto
export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const { data } = await api.post('/projects', input);
      return data.data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Proyecto creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear proyecto');
    },
  });
}

// Actualizar proyecto
export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateProjectInput & { id: string }) => {
      const { data } = await api.put(`/projects/${id}`, input);
      return data.data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Proyecto actualizado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar proyecto');
    },
  });
}

// Cambiar estado del proyecto
export function useChangeProjectStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { data } = await api.post(`/projects/${id}/status`, { status, notes });
      return data.data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Estado del proyecto actualizado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al cambiar estado');
    },
  });
}

// Registrar pago
export function useRegisterPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: RegisterPaymentInput) => {
      const { projectId, ...paymentData } = input;
      const { data } = await api.post(`/projects/${projectId}/payments`, paymentData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Pago registrado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al registrar pago');
    },
  });
}

// Actualizar pago
export function useUpdatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ paymentId, ...input }: { paymentId: string; [key: string]: any }) => {
      const { data } = await api.put(`/projects/payments/${paymentId}`, input);
      return data.data as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Pago actualizado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar pago');
    },
  });
}

export default {
  useProjects,
  useProject,
  useProjectStats,
  useProjectPayments,
  useCreateProject,
  useUpdateProject,
  useChangeProjectStatus,
  useRegisterPayment,
  useUpdatePayment,
};
