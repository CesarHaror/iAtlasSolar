// =====================================================
// HOOKS DE CLIENTES
// =====================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api, { ApiResponse } from '@/lib/api';

// Tipos
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  rfc: string | null;
  address: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  cfeServiceNumber: string | null;
  cfeTariff: string | null;
  notes: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    quotations: number;
    projects: number;
  };
}

export interface ClientWithDetails extends Client {
  quotations: Array<{
    id: string;
    quoteNumber: string;
    systemSize: number;
    salePrice: number;
    status: string;
    createdAt: string;
  }>;
  projects: Array<{
    id: string;
    projectNumber: string;
    status: string;
    totalAmount: number;
    paidAmount: number;
    createdAt: string;
  }>;
}

export interface CreateClientInput {
  name: string;
  email: string;
  phone: string;
  rfc?: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  cfeServiceNumber?: string;
  cfeTariff?: string;
  notes?: string;
  source?: string;
}

export interface ClientsResponse {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClientFilters {
  search?: string;
  city?: string;
  tariff?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Hook para obtener lista de clientes
 */
export function useClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
      
      const response = await api.get<ApiResponse<Client[]> & { pagination: ClientsResponse['pagination'] }>(
        `/clients?${params.toString()}`
      );
      return {
        clients: response.data.data || [],
        pagination: response.data.pagination,
      };
    },
  });
}

/**
 * Hook para buscar clientes (autocompletado)
 */
export function useSearchClients(search: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['clients', 'search', search],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Client[]>>(
        `/clients/search?q=${encodeURIComponent(search)}`
      );
      return response.data.data || [];
    },
    enabled: enabled && search.length >= 2,
  });
}

/**
 * Hook para obtener un cliente por ID
 */
export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ClientWithDetails>>(`/clients/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook para obtener estadísticas de clientes
 */
export function useClientStats() {
  return useQuery({
    queryKey: ['clients', 'stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{
        total: number;
        byCity: Array<{ city: string; count: number }>;
        byTariff: Array<{ tariff: string; count: number }>;
        recentClients: Client[];
      }>>('/clients/stats');
      return response.data.data;
    },
  });
}

/**
 * Hook para crear cliente
 */
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClientInput) => {
      const response = await api.post<ApiResponse<Client>>('/clients', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente creado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Error al crear cliente';
      toast.error(message);
    },
  });
}

/**
 * Hook para actualizar cliente
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateClientInput> }) => {
      const response = await api.put<ApiResponse<Client>>(`/clients/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Error al actualizar cliente';
      toast.error(message);
    },
  });
}

/**
 * Hook para eliminar cliente
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente eliminado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Error al eliminar cliente';
      toast.error(message);
    },
  });
}
