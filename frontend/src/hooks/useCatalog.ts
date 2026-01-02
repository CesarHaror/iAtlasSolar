// =====================================================
// HOOKS DE CATÁLOGO
// =====================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

// =====================================================
// TIPOS
// =====================================================

export interface Panel {
  id: string;
  brand: string;
  model: string;
  power: number;
  efficiency: number;
  warranty: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Inverter {
  id: string;
  brand: string;
  model: string;
  power: number;
  phases: number;
  warranty: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CityHSP {
  id: string;
  city: string;
  state: string;
  hsp: number;
  latitude?: number;
  longitude?: number;
}

export interface CatalogStats {
  panels: number;
  inverters: number;
  cities: number;
}

// =====================================================
// PANELES
// =====================================================

export function usePanels(includeInactive = false) {
  return useQuery({
    queryKey: ['panels', { includeInactive }],
    queryFn: async () => {
      const { data } = await api.get('/catalog/panels', {
        params: { includeInactive },
      });
      return data.data as Panel[];
    },
  });
}

export function usePanel(id: string) {
  return useQuery({
    queryKey: ['panel', id],
    queryFn: async () => {
      const { data } = await api.get(`/catalog/panels/${id}`);
      return data.data as Panel;
    },
    enabled: !!id,
  });
}

export function useCreatePanel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: Omit<Panel, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data } = await api.post('/catalog/panels', input);
      return data.data as Panel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['catalogStats'] });
      toast.success('Panel creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear panel');
    },
  });
}

export function useUpdatePanel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Panel> & { id: string }) => {
      const { data } = await api.put(`/catalog/panels/${id}`, input);
      return data.data as Panel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      toast.success('Panel actualizado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar panel');
    },
  });
}

export function useDeletePanel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, permanent = false }: { id: string; permanent?: boolean }) => {
      await api.delete(`/catalog/panels/${id}`, { params: { permanent } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panels'] });
      queryClient.invalidateQueries({ queryKey: ['catalogStats'] });
      toast.success('Panel eliminado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar panel');
    },
  });
}

// =====================================================
// INVERSORES
// =====================================================

export function useInverters(includeInactive = false) {
  return useQuery({
    queryKey: ['inverters', { includeInactive }],
    queryFn: async () => {
      const { data } = await api.get('/catalog/inverters', {
        params: { includeInactive },
      });
      return data.data as Inverter[];
    },
  });
}

export function useInverter(id: string) {
  return useQuery({
    queryKey: ['inverter', id],
    queryFn: async () => {
      const { data } = await api.get(`/catalog/inverters/${id}`);
      return data.data as Inverter;
    },
    enabled: !!id,
  });
}

export function useCreateInverter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: Omit<Inverter, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data } = await api.post('/catalog/inverters', input);
      return data.data as Inverter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverters'] });
      queryClient.invalidateQueries({ queryKey: ['catalogStats'] });
      toast.success('Inversor creado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear inversor');
    },
  });
}

export function useUpdateInverter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Inverter> & { id: string }) => {
      const { data } = await api.put(`/catalog/inverters/${id}`, input);
      return data.data as Inverter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverters'] });
      toast.success('Inversor actualizado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar inversor');
    },
  });
}

export function useDeleteInverter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, permanent = false }: { id: string; permanent?: boolean }) => {
      await api.delete(`/catalog/inverters/${id}`, { params: { permanent } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inverters'] });
      queryClient.invalidateQueries({ queryKey: ['catalogStats'] });
      toast.success('Inversor eliminado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar inversor');
    },
  });
}

// =====================================================
// CIUDADES HSP
// =====================================================

export function useCitiesHSP() {
  return useQuery({
    queryKey: ['citiesHSP'],
    queryFn: async () => {
      const { data } = await api.get('/catalog/cities');
      return data.data as CityHSP[];
    },
  });
}

export function useCityHSP(id: string) {
  return useQuery({
    queryKey: ['cityHSP', id],
    queryFn: async () => {
      const { data } = await api.get(`/catalog/cities/${id}`);
      return data.data as CityHSP;
    },
    enabled: !!id,
  });
}

export function useCreateCityHSP() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: Omit<CityHSP, 'id'>) => {
      const { data } = await api.post('/catalog/cities', input);
      return data.data as CityHSP;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citiesHSP'] });
      queryClient.invalidateQueries({ queryKey: ['catalogStats'] });
      toast.success('Ciudad creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear ciudad');
    },
  });
}

export function useUpdateCityHSP() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CityHSP> & { id: string }) => {
      const { data } = await api.put(`/catalog/cities/${id}`, input);
      return data.data as CityHSP;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citiesHSP'] });
      toast.success('Ciudad actualizada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar ciudad');
    },
  });
}

export function useDeleteCityHSP() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/catalog/cities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['citiesHSP'] });
      queryClient.invalidateQueries({ queryKey: ['catalogStats'] });
      toast.success('Ciudad eliminada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar ciudad');
    },
  });
}

// =====================================================
// ESTADÍSTICAS
// =====================================================

export function useCatalogStats() {
  return useQuery({
    queryKey: ['catalogStats'],
    queryFn: async () => {
      const { data } = await api.get('/catalog/stats');
      return data.data as CatalogStats;
    },
  });
}
