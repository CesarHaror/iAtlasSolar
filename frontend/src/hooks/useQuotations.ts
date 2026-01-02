// =====================================================
// HOOKS DE COTIZACIONES
// =====================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

// =====================================================
// TIPOS
// =====================================================

export interface CalculationInput {
  monthlyKwh: number;
  bimonthlyBill?: number;
  cfeTariff: string;
  city: string;
  state?: string;
  customHSP?: number;
  panelId?: string;
  inverterId?: string;
  installationType: 'ROOF' | 'GROUND' | 'CARPORT';
  systemLosses?: number;
  marginPercentage?: number;
}

export interface CalculationResult {
  systemSizeKwp: number;
  numberOfPanels: number;
  numberOfInverters: number;
  roofAreaM2: number;
  annualGenerationKwh: number;
  monthlyGenerationKwh: number;
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
  monthlyBillBefore: number;
  monthlyBillAfter: number;
  monthlySavings: number;
  annualSavings: number;
  savingsPercentage: number;
  consumptionCoveragePercent?: number;
  paybackYears: number;
  roi25Years: number;
  lifetimeSavings: number;
  cfeTariff: string;
  tariffRate: number;
  hsp: number;
  co2OffsetTons: number;
  treesEquivalent: number;
}

export interface CreateQuotationInput {
  clientId: string;
  monthlyKwh: number;
  bimonthlyBill?: number;
  cfeTariff: string;
  city: string;
  state?: string;
  panelId?: string;
  inverterId?: string;
  installationType: 'ROOF' | 'GROUND' | 'CARPORT';
  discount?: number;
  notes?: string;
  internalNotes?: string;
  validUntil?: string;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  version: number;
  clientId: string;
  createdById: string;
  status: 'DRAFT' | 'SENT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  validUntil?: string;
  monthlyConsumption: number;
  avgBill: number;
  tariff: string;
  systemSize: number;
  panelsQty: number;
  panelBrand: string;
  panelModel: string;
  panelPower: number;
  inverterBrand: string;
  inverterModel: string;
  inverterPower: number;
  structureType?: string;
  monthlyProduction: number;
  annualProduction?: number;
  coveragePercent?: number;
  hspUsed?: number;
  realCost: number;
  salePrice: number;
  discount?: number;
  profitAmount: number;
  profitMargin: number;
  costBreakdown?: any;
  monthlySavings: number;
  monthlyBillAfter?: number;
  annualSavings?: number;
  paybackYears?: number;
  roi25Years?: number;
  pdfUrl?: string;
  notes?: string;
  clientNotes?: string;
  sentAt?: string;
  viewedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface Panel {
  id: string;
  brand: string;
  model: string;
  watts: number;
  efficiency: number;
  warranty: number;
  price: number;
}

export interface Inverter {
  id: string;
  brand: string;
  model: string;
  capacityKw: number;
  type: string;
  phases: number;
  warranty: number;
  price: number;
}

export interface CityHSP {
  id: string;
  city: string;
  state: string;
  hsp: number;
}

// =====================================================
// HOOKS DE CATÁLOGOS
// =====================================================

export function usePanels() {
  return useQuery({
    queryKey: ['panels'],
    queryFn: async () => {
      const response = await api.get('/quotations/panels');
      return response.data.data as Panel[];
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  });
}

export function useInverters() {
  return useQuery({
    queryKey: ['inverters'],
    queryFn: async () => {
      const response = await api.get('/quotations/inverters');
      return response.data.data as Inverter[];
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  });
}

export function useCities() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const response = await api.get('/quotations/cities');
      return response.data.data as CityHSP[];
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 horas
  });
}

// =====================================================
// HOOK DE CÁLCULO
// =====================================================

export function useCalculateSolar() {
  return useMutation({
    mutationFn: async (input: CalculationInput) => {
      const response = await api.post('/quotations/calculate', input);
      return response.data.data as CalculationResult;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al calcular');
    },
  });
}

// =====================================================
// HOOKS DE COTIZACIONES
// =====================================================

interface QuotationsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  clientId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useQuotations(params: QuotationsParams = {}) {
  return useQuery({
    queryKey: ['quotations', params],
    queryFn: async () => {
      const response = await api.get('/quotations', { params });
      return response.data;
    },
  });
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: ['quotation', id],
    queryFn: async () => {
      const response = await api.get(`/quotations/${id}`);
      return response.data.data as Quotation;
    },
    enabled: !!id,
  });
}

export function useQuotationStats() {
  return useQuery({
    queryKey: ['quotationStats'],
    queryFn: async () => {
      const response = await api.get('/quotations/stats');
      return response.data.data;
    },
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateQuotationInput) => {
      const response = await api.post('/quotations', input);
      return response.data.data as Quotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotationStats'] });
      toast.success('Cotización creada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al crear cotización');
    },
  });
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Quotation> }) => {
      const response = await api.put(`/quotations/${id}`, data);
      return response.data.data as Quotation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['quotationStats'] });
      toast.success('Cotización actualizada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al actualizar cotización');
    },
  });
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/quotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotationStats'] });
      toast.success('Cotización eliminada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al eliminar cotización');
    },
  });
}

export function useDuplicateQuotation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/quotations/${id}/duplicate`);
      return response.data.data as Quotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Cotización duplicada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al duplicar cotización');
    },
  });
}
