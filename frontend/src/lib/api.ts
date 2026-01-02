// =====================================================
// CLIENTE AXIOS CONFIGURADO
// =====================================================

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

// Crear instancia de axios
export const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request - añadir token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response - manejar errores
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Si el token expiró, hacer logout
    if (error.response?.status === 401) {
      const logout = useAuthStore.getState().logout;
      logout();
      
      // Redirigir al login
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Tipos de respuesta
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export default api;
