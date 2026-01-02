// =====================================================
// HOOKS DE PROFORMAS (PREFACTURAS)
// =====================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

// =====================================================
// TIPOS
// =====================================================

export interface PaymentPlanItem {
  phase: 'ANTICIPO' | 'MATERIALES' | 'FINIQUITO';
  label: string;
  percent: number;
  amount: number;
}

export interface Proforma {
  id: string;
  proformaNumber: string;
  quotationId: string;
  clientId: string;
  status: 'DRAFT' | 'SENT' | 'PENDING_SIGNATURE' | 'SIGNED' | 'CANCELLED';
  subtotal: number;
  iva: number;
  total: number;
  paymentPlan: PaymentPlanItem[];
  termsConditions?: string;
  signatureImage?: string;
  signedAt?: string;
  signedByName?: string;
  signedByEmail?: string;
  pdfUrl?: string;
  notes?: string;
  sentAt?: string;
  viewedAt?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
  quotation: {
    id?: string;
    quoteNumber: string;
    systemSize: number;
    panelsQty?: number;
    panelBrand?: string;
    panelModel?: string;
    inverterBrand?: string;
    inverterModel?: string;
  };
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
  };
  project?: {
    id: string;
    projectNumber: string;
    status: string;
  };
}

export interface CreateProformaInput {
  quotationId: string;
  paymentPlan?: PaymentPlanItem[];
  termsConditions?: string;
  notes?: string;
  validUntil?: string;
}

export interface UpdateProformaInput {
  paymentPlan?: PaymentPlanItem[];
  termsConditions?: string;
  notes?: string;
  validUntil?: string;
}

export interface SignProformaInput {
  signatureImage: string;
  signedByName: string;
  signedByEmail: string;
}

export interface ListProformasParams {
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | null;
}

export interface ProformaStats {
  total: number;
  byStatus: {
    draft: number;
    sent: number;
    pendingSignature: number;
    signed: number;
    cancelled: number;
  };
  totalAmount: number;
  signedAmount: number;
  conversionRate: number;
}

// =====================================================
// QUERY KEYS
// =====================================================

export const proformaKeys = {
  all: ['proformas'] as const,
  lists: () => [...proformaKeys.all, 'list'] as const,
  list: (params: ListProformasParams) => [...proformaKeys.lists(), params] as const,
  details: () => [...proformaKeys.all, 'detail'] as const,
  detail: (id: string) => [...proformaKeys.details(), id] as const,
  stats: () => [...proformaKeys.all, 'stats'] as const,
};

// =====================================================
// HOOKS
// =====================================================

// Listar proformas
export function useProformas(params: ListProformasParams = {}) {
  return useQuery({
    queryKey: proformaKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get('/proformas', { params });
      return data;
    },
  });
}

// Obtener proforma por ID
export function useProforma(id: string) {
  return useQuery({
    queryKey: proformaKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/proformas/${id}`);
      return data.data as Proforma;
    },
    enabled: !!id,
  });
}

// Estadísticas de proformas
export function useProformaStats() {
  return useQuery({
    queryKey: proformaKeys.stats(),
    queryFn: async () => {
      const { data } = await api.get('/proformas/stats');
      return data.data as ProformaStats;
    },
  });
}

// Crear proforma
export function useCreateProforma() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateProformaInput) => {
      const { data } = await api.post('/proformas', input);
      return data.data as Proforma & { alreadyExisted?: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proformaKeys.all });
      // Toast se maneja en el componente para diferenciar entre nueva y existente
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear proforma');
    },
  });
}

// Actualizar proforma
export function useUpdateProforma() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateProformaInput & { id: string }) => {
      const { data } = await api.put(`/proformas/${id}`, input);
      return data.data as Proforma;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proformaKeys.all });
      toast.success('Proforma actualizada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar proforma');
    },
  });
}

// Enviar proforma
export function useSendProforma() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/proformas/${id}/send`);
      return data.data as Proforma;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proformaKeys.all });
      toast.success('Proforma enviada al cliente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al enviar proforma');
    },
  });
}

// Firmar proforma
export function useSignProforma() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: SignProformaInput & { id: string }) => {
      const { data } = await api.post(`/proformas/${id}/sign`, input);
      return data.data as Proforma;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proformaKeys.all });
      toast.success('Proforma firmada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al firmar proforma');
    },
  });
}

// Cancelar proforma
export function useCancelProforma() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await api.post(`/proformas/${id}/cancel`, { reason });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proformaKeys.all });
      toast.success('Proforma cancelada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al cancelar proforma');
    },
  });
}

export default {
  useProformas,
  useProforma,
  useProformaStats,
  useCreateProforma,
  useUpdateProforma,
  useSendProforma,
  useSignProforma,
  useCancelProforma,
};
