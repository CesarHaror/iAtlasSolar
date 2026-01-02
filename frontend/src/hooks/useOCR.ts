// =====================================================
// HOOK PARA OCR - ANÁLISIS DE RECIBOS CFE
// =====================================================

import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// Tipos para los datos del recibo CFE
export interface CFEReceiptData {
  serviceNumber: string | null;
  rmu: string | null;
  clientName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  tariff: string | null;
  consumption: {
    currentPeriod: number | null;
    previousPeriod: number | null;
    average: number | null;
    monthly: number | null;
    // Historial de consumo
    history?: {
      period: string;
      kwh: number;
      amount: number | null;
    }[];
    historicalAverage?: number | null;
  };
  billing: {
    totalAmount: number | null;
    periodStart: string | null;
    periodEnd: string | null;
    dueDate: string | null;
    // Gasto promedio calculado del historial
    averageAmount?: number | null;
    historicalAmounts?: number[];
  };
  industrial?: {
    demandKw: number | null;
    powerFactor: number | null;
    consumptionBase: number | null;
    consumptionIntermediate: number | null;
    consumptionPeak: number | null;
  };
  confidence: number;
  warnings: string[];
}

interface OCRStatus {
  available: boolean;
  provider: string | null;
  message: string;
}

interface AnalyzeResponse {
  success: boolean;
  data: CFEReceiptData;
  message: string;
}

// Verificar estado del servicio OCR
export const useOCRStatus = () => {
  return useQuery<OCRStatus>({
    queryKey: ['ocr-status'],
    queryFn: async () => {
      const { data } = await api.get('/ocr/status');
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    retry: false,
  });
};

// Analizar recibo desde archivo
export const useAnalyzeReceipt = () => {
  return useMutation<CFEReceiptData, Error, File>({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('receipt', file);
      
      const { data } = await api.post<AnalyzeResponse>('/ocr/analyze-receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 segundos timeout (análisis puede tardar)
      });
      
      return data.data;
    },
  });
};

// Analizar recibo desde base64
export const useAnalyzeReceiptBase64 = () => {
  return useMutation<CFEReceiptData, Error, { image: string; mimeType: string }>({
    mutationFn: async ({ image, mimeType }) => {
      const { data } = await api.post<AnalyzeResponse>('/ocr/analyze-receipt-base64', {
        image,
        mimeType,
      }, {
        timeout: 60000,
      });
      
      return data.data;
    },
  });
};
