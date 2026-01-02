// =====================================================
// HOOKS DE AUTENTICACIÓN
// =====================================================

import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { ApiResponse } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface LoginCredentials {
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'VENDEDOR' | 'INSTALADOR' | 'VIEWER';
  phone: string | null;
}

interface AuthResponse {
  user: User;
  token: string;
  expiresIn: string;
}

/**
 * Hook para login
 */
export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await api.post<ApiResponse<AuthResponse>>(
        '/auth/login',
        credentials
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setAuth(data.data.user, data.data.token);
        toast.success('¡Bienvenido de vuelta!');
        navigate('/dashboard');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Error al iniciar sesión';
      toast.error(message);
    },
  });
}

/**
 * Hook para logout
 */
export function useLogout() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  return () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };
}

/**
 * Hook para obtener perfil del usuario actual
 */
export function useProfile() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<User>>('/auth/profile');
      return response.data.data;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Hook para verificar autenticación
 */
export function useVerifyAuth() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  return useQuery({
    queryKey: ['verify-auth'],
    queryFn: async () => {
      try {
        const response = await api.post<ApiResponse<{ userId: string }>>(
          '/auth/verify'
        );
        return response.data.success;
      } catch {
        logout();
        return false;
      }
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: false,
  });
}
