// =====================================================
// HOOKS DE CONFIGURACIÓN
// =====================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

// =====================================================
// TIPOS
// =====================================================

export interface ConfigItem {
  key: string;
  value: string;
  description: string | null;
}

export interface ConfigGroups {
  [group: string]: ConfigItem[];
}

// =====================================================
// QUERIES
// =====================================================

export function useConfigs() {
  return useQuery({
    queryKey: ['configs'],
    queryFn: async () => {
      const { data } = await api.get('/config');
      return data.data as Record<string, string>;
    },
  });
}

export function useConfigsGrouped() {
  return useQuery({
    queryKey: ['configsGrouped'],
    queryFn: async () => {
      const { data } = await api.get('/config/grouped');
      return data.data as ConfigGroups;
    },
  });
}

export function useConfig(key: string) {
  return useQuery({
    queryKey: ['config', key],
    queryFn: async () => {
      const { data } = await api.get(`/config/${key}`);
      return data.data as { key: string; value: string };
    },
    enabled: !!key,
  });
}

// =====================================================
// MUTATIONS
// =====================================================

export function useSetConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description?: string }) => {
      const { data } = await api.post('/config', { key, value, description });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      queryClient.invalidateQueries({ queryKey: ['configsGrouped'] });
      toast.success('Configuración guardada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar configuración');
    },
  });
}

export function useSetConfigs() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (configs: Record<string, string>) => {
      const { data } = await api.post('/config/bulk', { configs });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      queryClient.invalidateQueries({ queryKey: ['configsGrouped'] });
      toast.success('Configuraciones guardadas');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar configuraciones');
    },
  });
}

export function useDeleteConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (key: string) => {
      await api.delete(`/config/${key}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      queryClient.invalidateQueries({ queryKey: ['configsGrouped'] });
      toast.success('Configuración eliminada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al eliminar configuración');
    },
  });
}

export function useInitializeDefaults() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/config/initialize');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      queryClient.invalidateQueries({ queryKey: ['configsGrouped'] });
      toast.success(`${data.data.count} configuraciones inicializadas`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al inicializar');
    },
  });
}
