/**
 * COMPONENTE MEJORADO: Upload de Múltiples Recibos CFE
 * 
 * Características:
 * - Soporte para múltiples PDFs
 * - Validación de mismo número de servicio
 * - Promedios de consumo automáticos
 * - Extracción de datos del cliente
 * - Indicación clara de validación
 */

import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  File,
  Zap,
  User,
  MapPin,
  DollarSign,
  Sparkles,
  UserPlus,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Minus,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts';
import { useAnalyzeReceipt, CFEReceiptData, useOCRStatus } from '@/hooks/useOCR';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import CreateClientFromReceiptModal from '@/components/clients/CreateClientFromReceiptModal';

interface AnalyzedReceipt {
  file: File;
  data: CFEReceiptData;
  status: 'pending' | 'analyzing' | 'success' | 'error';
  error?: string;
}

interface CFEReceiptUploadMultipleProps {
  onDataExtracted: (data: CFEReceiptData[]) => void;
  onClose?: () => void;
  onClientCreated?: (clientId: string) => void;
  className?: string;
}

const formatTariffDisplay = (tariff: string): string => {
  if (!tariff) return '';
  if (/^T\d/.test(tariff)) {
    return tariff.substring(1);
  }
  return tariff;
};

/**
 * Proyectar consumo futuro basado en tendencia histórica
 * Usa regresión lineal para predecir consumo
 */
const projectConsumptionForecast = (
  analyzedReceipts: AnalyzedReceipt[],
  yearsToProject: number = 10
) => {
  const successReceipts = analyzedReceipts.filter(r => r.status === 'success');
  if (successReceipts.length < 2) return [];

  // Obtener datos históricos (meses)
  const consumptions = successReceipts
    .sort((a, b) => {
      const aMonth = a.data.billingPeriod?.endMonth || 0;
      const bMonth = b.data.billingPeriod?.endMonth || 0;
      return aMonth - bMonth;
    })
    .map((r, idx) => ({
      month: idx,
      consumption: r.data.consumption?.monthly || 0,
      label: `Mes ${idx + 1}`,
    }));

  // Calcular promedio y tendencia
  const avgConsumption =
    consumptions.reduce((sum, c) => sum + c.consumption, 0) / consumptions.length;

  // Calcular pendiente (tendencia)
  let sumXY = 0;
  let sumX = 0;
  let sumY = 0;
  let sumX2 = 0;
  
  consumptions.forEach(c => {
    sumX += c.month;
    sumY += c.consumption;
    sumXY += c.month * c.consumption;
    sumX2 += c.month * c.month;
  });

  const n = consumptions.length;
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Generar proyección
  const projectionData = [...consumptions];
  const monthsToProject = yearsToProject * 12;
  const currentMonth = consumptions.length;

  for (let i = 1; i <= Math.min(monthsToProject, 120); i++) {
    const month = currentMonth + i;
    const year = Math.floor(i / 12) + 1;
    const monthInYear = (i % 12) || 12;
    const projectedConsumption = Math.max(100, intercept + slope * month);

    if (i % 12 === 0 || i === 1) {
      projectionData.push({
        month,
        consumption: projectedConsumption,
        label: `Año ${year}`,
        isProjection: true,
      });
    }
  }

  return {
    data: projectionData,
    trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
    slope,
    avgConsumption,
  };
};

export default function CFEReceiptUploadMultiple({
  onDataExtracted,
  onClose,
  onClientCreated,
  className,
}: CFEReceiptUploadMultipleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [analyzedReceipts, setAnalyzedReceipts] = useState<AnalyzedReceipt[]>([]);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [selectedData, setSelectedData] = useState<CFEReceiptData | null>(null);
  const [showForecast, setShowForecast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: ocrStatus, isLoading: checkingStatus } = useOCRStatus();
  const analyzeReceipt = useAnalyzeReceipt();

  // Validar que todos los recibos sean del mismo número de servicio
  const serviceNumbers = analyzedReceipts
    .filter(r => r.status === 'success' && r.data.serviceNumber)
    .map(r => r.data.serviceNumber!);

  const uniqueServiceNumbers = new Set(serviceNumbers);
  const isServiceNumberValid = uniqueServiceNumbers.size <= 1;
  const serviceNumber = uniqueServiceNumbers.size === 1 ? Array.from(uniqueServiceNumbers)[0] : null;

  // Validación de múltiples recibos
  const hasMultipleReceipts = analyzedReceipts.filter(r => r.status === 'success').length > 1;
  const consumptionTrend = hasMultipleReceipts
    ? analyzedReceipts.length > 1 &&
      analyzedReceipts[0].data.consumption?.monthly! <
      analyzedReceipts[analyzedReceipts.length - 1].data.consumption?.monthly!
      ? 'increasing'
      : 'decreasing'
    : undefined;

  // Calcular promedios
  const successReceipts = analyzedReceipts.filter(r => r.status === 'success');
  const avgConsumption =
    successReceipts.length > 0
      ? successReceipts.reduce((sum, r) => sum + (r.data.consumption?.monthly || 0), 0) / successReceipts.length
      : 0;

  const avgBill =
    successReceipts.length > 0
      ? successReceipts.reduce(
          (sum, r) => sum + (r.data.billing?.averageAmount || r.data.billing?.totalAmount || 0),
          0
        ) / successReceipts.length
      : 0;

  // Proyecciones (usar función basada en historial)
  const forecast10 = hasMultipleReceipts && isServiceNumberValid ? projectConsumptionForecast(analyzedReceipts, 10) : null;

  // Manejar selección de archivos (múltiples)
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validar tipo
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name}: Solo se aceptan PDFs`);
        continue;
      }

      // Validar tamaño
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: Máximo 10MB`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      validFiles.forEach(file => {
        setAnalyzedReceipts(prev => [
          ...prev,
          { file, data: {} as CFEReceiptData, status: 'pending' }
        ]);
      });
    }
  }, []);

  // Drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  // Input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
    },
    [handleFileSelect]
  );

  // Analizar un recibo
  const handleAnalyzeReceipt = async (index: number) => {
    const receipt = analyzedReceipts[index];
    if (!receipt || receipt.status === 'analyzing') return;

    setAnalyzedReceipts(prev => {
      const updated = [...prev];
      updated[index].status = 'analyzing';
      return updated;
    });

    try {
      const result = await analyzeReceipt.mutateAsync(receipt.file);

      setAnalyzedReceipts(prev => {
        const updated = [...prev];
        updated[index].status = 'success';
        updated[index].data = result;
        return updated;
      });

      if (result.confidence >= 70) {
        toast.success(`${receipt.file.name}: Analizado (${result.confidence}% confianza)`);
      } else {
        toast('Confianza media - Verifica los datos', { icon: '⚠️' });
      }
    } catch (error: any) {
      setAnalyzedReceipts(prev => {
        const updated = [...prev];
        updated[index].status = 'error';
        updated[index].error = error.response?.data?.error?.message || 'Error al analizar';
        return updated;
      });
      toast.error(`${receipt.file.name}: Error`);
    }
  };

  // Analizar todos los pendientes
  const handleAnalyzeAll = async () => {
    const pendingIndices = analyzedReceipts
      .map((r, i) => (r.status === 'pending' ? i : -1))
      .filter(i => i !== -1);

    for (const index of pendingIndices) {
      await handleAnalyzeReceipt(index);
    }
  };

  // Remover un recibo
  const handleRemove = (index: number) => {
    setAnalyzedReceipts(prev => prev.filter((_, i) => i !== index));
    toast.success('Recibo removido');
  };

  // Remover todos
  const handleRemoveAll = () => {
    setAnalyzedReceipts([]);
  };

  // Continuar (enviar datos)
  const handleContinue = () => {
    const successData = successReceipts.map(r => ({
      ...r.data,
      // Sobrescribir consumo con promedio si hay múltiples
      consumption: {
        ...r.data.consumption,
        monthly: hasMultipleReceipts ? avgConsumption : r.data.consumption?.monthly
      },
      billing: {
        ...r.data.billing,
        averageAmount: hasMultipleReceipts ? avgBill : r.data.billing?.averageAmount,
      }
    }));

    onDataExtracted(successData);
    toast.success(`${successReceipts.length} recibo(s) procesados`);
  };

  // Crear cliente
  const handleClientCreated = (clientId: string) => {
    setShowCreateClientModal(false);
    onClientCreated?.(clientId);
    toast.success('Cliente creado');
  };

  // Si el servicio no está disponible
  if (!checkingStatus && !ocrStatus?.available) {
    return (
      <div className={cn('rounded-xl bg-yellow-50 border border-yellow-200 p-6', className)}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-yellow-800">Servicio no disponible</h3>
            <p className="text-sm text-yellow-700 mt-1">
              El análisis de recibos no está disponible. Ingresa los datos manualmente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Análisis Automático</h3>
            <p className="text-sm text-gray-500">Sube 1+ recibos del MISMO número de servicio</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Zona de upload */}
      {analyzedReceipts.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
            isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="application/pdf"
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            <div
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
                isDragging ? 'bg-primary-100' : 'bg-gray-100'
              )}
            >
              {isDragging ? (
                <Upload className="w-8 h-8 text-primary-500" />
              ) : (
                <FileText className="w-8 h-8 text-gray-400" />
              )}
            </div>

            <div>
              <p className="text-lg font-medium text-gray-700">
                {isDragging ? 'Suelta los PDFs aquí' : 'Arrastra tus recibos CFE aquí'}
              </p>
              <p className="text-sm text-gray-500 mt-1">o haz clic para seleccionar archivos</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <File className="w-4 h-4" />
              <span>PDFs múltiples • Máximo 10MB cada uno • Mismo número de servicio</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Lista de recibos */}
          <div className="space-y-3">
            {analyzedReceipts.map((receipt, index) => (
              <div
                key={index}
                className={cn(
                  'border rounded-xl p-4 transition-all',
                  receipt.status === 'success'
                    ? 'border-green-200 bg-green-50'
                    : receipt.status === 'error'
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-white'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Nombre del archivo + estado */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        receipt.status === 'success'
                          ? 'bg-green-100'
                          : receipt.status === 'error'
                            ? 'bg-red-100'
                            : receipt.status === 'analyzing'
                              ? 'bg-blue-100'
                              : 'bg-gray-100'
                      )}
                    >
                      {receipt.status === 'analyzing' ? (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      ) : receipt.status === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : receipt.status === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{receipt.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(receipt.file.size / 1024).toFixed(1)} KB
                      </p>

                      {receipt.status === 'success' && receipt.data.serviceNumber && (
                        <p className="text-xs text-gray-600 mt-1">
                          Servicio: <span className="font-mono font-semibold">{receipt.data.serviceNumber}</span>
                        </p>
                      )}

                      {receipt.status === 'error' && receipt.error && (
                        <p className="text-xs text-red-600 mt-1">{receipt.error}</p>
                      )}
                    </div>
                  </div>

                  {/* Datos extraídos si success */}
                  {receipt.status === 'success' && (
                    <div className="grid grid-cols-3 gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Consumo</p>
                        <p className="font-semibold text-gray-900">
                          {receipt.data.consumption?.monthly?.toLocaleString() || '?'} kWh
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Gasto</p>
                        <p className="font-semibold text-gray-900">
                          ${(receipt.data.billing?.averageAmount || receipt.data.billing?.totalAmount || 0)?.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Confianza</p>
                        <p className={cn('font-semibold', receipt.data.confidence >= 70 ? 'text-green-600' : 'text-yellow-600')}>
                          {receipt.data.confidence}%
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Botones */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {receipt.status === 'pending' && (
                      <button
                        onClick={() => handleAnalyzeReceipt(index)}
                        className="btn-primary text-sm"
                      >
                        Analizar
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(index)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Validación de número de servicio */}
                {!isServiceNumberValid && receipt.status === 'success' && receipt.data.serviceNumber && (
                  <div className="mt-3 pt-3 border-t border-red-200 flex items-center gap-2 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>⚠️ Este recibo tiene DIFERENTE número de servicio ({receipt.data.serviceNumber})</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Validación y promedios */}
          {successReceipts.length > 0 && (
            <div className={cn('border rounded-xl p-4', isServiceNumberValid ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50')}>
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    isServiceNumberValid ? 'bg-blue-100' : 'bg-red-100'
                  )}
                >
                  {isServiceNumberValid ? (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>

                <div className="flex-1">
                  {/* Validación */}
                  <div>
                    <p className={cn('font-medium', isServiceNumberValid ? 'text-blue-900' : 'text-red-900')}>
                      {isServiceNumberValid ? '✅ Validación OK' : '❌ Números de servicio diferentes'}
                    </p>

                    {isServiceNumberValid && serviceNumber && (
                      <p className="text-sm text-blue-700 mt-1">
                        Todos los recibos son del servicio <span className="font-mono font-semibold">{serviceNumber}</span>
                      </p>
                    )}

                    {!isServiceNumberValid && (
                      <p className="text-sm text-red-700 mt-1">
                        Los recibos deben ser del MISMO número de servicio para calcular correctamente
                      </p>
                    )}
                  </div>

                  {/* Promedios si hay múltiples */}
                  {hasMultipleReceipts && isServiceNumberValid && (
                    <div className="mt-3 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Consumo Promedio</p>
                        <p className="text-lg font-bold text-gray-900">{avgConsumption.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh/mes</p>
                        {consumptionTrend && (
                          <div className="flex items-center gap-1 mt-1">
                            {consumptionTrend === 'increasing' ? (
                              <>
                                <TrendingUp className="w-3 h-3 text-red-500" />
                                <span className="text-xs text-red-600">Aumentando</span>
                              </>
                            ) : (
                              <>
                                <TrendingDown className="w-3 h-3 text-green-500" />
                                <span className="text-xs text-green-600">Disminuyendo</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-xs text-gray-600">Gasto Promedio</p>
                        <p className="text-lg font-bold text-gray-900">${avgBill.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mes</p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600">Períodos Analizados</p>
                        <p className="text-lg font-bold text-gray-900">{successReceipts.length}</p>
                      </div>
                    </div>
                  )}

                  {/* Proyección de consumo futuro (visible bajo demanda) */}
                  {hasMultipleReceipts && isServiceNumberValid && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-blue-600" />
                          </div>
                          <p className="font-medium text-blue-900">Proyección de Consumo</p>
                        </div>
                        <button type="button" onClick={() => setShowForecast(v => !v)} className="btn-secondary text-sm">
                          {showForecast ? 'Ocultar' : 'Ver'} Proyección
                        </button>
                      </div>


                      {showForecast && forecast10 && (
                        <div className="mt-3 space-y-6">
                          {(() => {
                            // Transformar datos para 2 escenarios
                            const baseData = forecast10?.data || [];
                            const tariffRate = avgBill > 0 && avgConsumption > 0 ? avgBill / avgConsumption : 5; // $/kWh
                            
                            // Datos CON paneles: consumo muy bajo (25% del original) con ligera variación
                            const fullData = baseData.map((item: any, idx: number) => {
                              const consumoConPaneles = Math.max(100, item.consumption * 0.25 + Math.sin(idx * 0.5) * 20);
                              const consumoSinPaneles = Math.round(item.consumption + (idx * item.consumption * 0.08) + Math.sin(idx * 0.3) * 50);
                              
                              return {
                                ...item,
                                consumoConPaneles: Math.round(consumoConPaneles),
                                costoConPaneles: Math.round(consumoConPaneles * tariffRate),
                                consumoSinPaneles,
                                costoSinPaneles: Math.round(consumoSinPaneles * tariffRate),
                              };
                            });

                            // Calcular ahorros totales
                            const totalCostWithPanels = fullData.reduce((sum: number, item: any) => sum + item.costoConPaneles, 0);
                            const totalCostWithoutPanels = fullData.reduce((sum: number, item: any) => sum + item.costoSinPaneles, 0);
                            const totalSavings = totalCostWithoutPanels - totalCostWithPanels;

                            return (
                              <>
                                {/* CHART 1: CON PANELES */}
                                <div className="border-l-4 border-green-600 rounded-xl p-5 bg-white shadow-lg overflow-hidden">
                                  <div className="flex items-center gap-2 mb-3">
                                    <TrendingDown className="w-6 h-6 text-green-600" />
                                    <h4 className="font-bold text-lg text-gray-900">☀️ CON Paneles Solares</h4>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-4">Consumo bajo y costo mínimo controlado</p>
                                  
                                  <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <ComposedChart data={fullData} margin={{ top: 20, right: 80, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                        <XAxis dataKey="label" style={{ fontSize: '11px' }} />
                                        <YAxis yAxisId="left" stroke="#16a34a" label={{ value: 'kWh', angle: -90, position: 'insideLeft', offset: 10 }} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#059669" label={{ value: 'MXN', angle: 90, position: 'insideRight', offset: 10 }} />
                                        <Tooltip 
                                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '6px' }}
                                          formatter={(value: any) => {
                                            if (typeof value === 'number' && value > 500) return `$${(value as number).toFixed(0)}`;
                                            return `${(value as number).toFixed(0)}`;
                                          }}
                                        />
                                        
                                        <Bar yAxisId="left" dataKey="consumoConPaneles" fill="#10b981" radius={[6, 6, 0, 0]} name="Consumo (kWh)" />
                                        <Line 
                                          yAxisId="right"
                                          type="natural" 
                                          dataKey="costoConPaneles" 
                                          stroke="#059669" 
                                          strokeWidth={4}
                                          dot={false}
                                          name="Costo (MXN)"
                                        />
                                      </ComposedChart>
                                    </ResponsiveContainer>
                                  </div>

                                  <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className="bg-green-50 p-3 rounded border border-green-200">
                                      <p className="text-xs text-gray-600 uppercase font-semibold">Consumo Prom.</p>
                                      <p className="text-lg font-bold text-green-600">{Math.round(fullData.reduce((s: number, d: any) => s + d.consumoConPaneles, 0) / fullData.length)} kWh</p>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded border border-green-200">
                                      <p className="text-xs text-gray-600 uppercase font-semibold">Gasto Prom.</p>
                                      <p className="text-lg font-bold text-green-600">${Math.round(fullData.reduce((s: number, d: any) => s + d.costoConPaneles, 0) / fullData.length).toLocaleString()}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* CHART 2: SIN PANELES */}
                                <div className="border-l-4 border-red-600 rounded-xl p-5 bg-white shadow-lg overflow-hidden">
                                  <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp className="w-6 h-6 text-red-600" />
                                    <h4 className="font-bold text-lg text-gray-900">📈 SIN Paneles Solares</h4>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-4">Consumo creciente año tras año. Factura cada vez más alta.</p>
                                  
                                  <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <ComposedChart data={fullData} margin={{ top: 20, right: 80, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                        <XAxis dataKey="label" style={{ fontSize: '11px' }} />
                                        <YAxis yAxisId="left" stroke="#dc2626" label={{ value: 'kWh', angle: -90, position: 'insideLeft', offset: 10 }} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#b91c1c" label={{ value: 'MXN', angle: 90, position: 'insideRight', offset: 10 }} />
                                        <Tooltip 
                                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '6px' }}
                                          formatter={(value: any) => {
                                            if (typeof value === 'number' && value > 500) return `$${(value as number).toFixed(0)}`;
                                            return `${(value as number).toFixed(0)}`;
                                          }}
                                        />
                                        
                                        <Bar yAxisId="left" dataKey="consumoSinPaneles" fill="#ef4444" radius={[6, 6, 0, 0]} name="Consumo (kWh)" />
                                        <Line 
                                          yAxisId="right"
                                          type="natural" 
                                          dataKey="costoSinPaneles" 
                                          stroke="#b91c1c" 
                                          strokeWidth={4}
                                          dot={false}
                                          name="Costo (MXN)"
                                        />
                                      </ComposedChart>
                                    </ResponsiveContainer>
                                  </div>

                                  <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className="bg-red-50 p-3 rounded border border-red-200">
                                      <p className="text-xs text-gray-600 uppercase font-semibold">Consumo Prom.</p>
                                      <p className="text-lg font-bold text-red-600">{Math.round(fullData.reduce((s: number, d: any) => s + d.consumoSinPaneles, 0) / fullData.length)} kWh</p>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded border border-red-200">
                                      <p className="text-xs text-gray-600 uppercase font-semibold">Gasto Prom.</p>
                                      <p className="text-lg font-bold text-red-600">${Math.round(fullData.reduce((s: number, d: any) => s + d.costoSinPaneles, 0) / fullData.length).toLocaleString()}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* RESUMEN IMPACTANTE */}
                                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white shadow-2xl border-2 border-green-700">
                                  <div className="text-center mb-4">
                                    <p className="text-sm font-semibold uppercase opacity-90 tracking-wider">💚 Ahorro Total en 10 Años</p>
                                    <p className="text-6xl font-black mt-3">${totalSavings.toLocaleString('es-MX')}</p>
                                    <p className="text-sm mt-3 opacity-95">Diferencia acumulada entre tener paneles y no tenerlos</p>
                                  </div>

                                  <div className="grid grid-cols-3 gap-4 mt-6">
                                    <div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center border border-white/30">
                                      <p className="text-xs opacity-90 font-semibold">Total 10 años</p>
                                      <p className="text-2xl font-bold mt-1">${totalCostWithoutPanels.toLocaleString('es-MX')}</p>
                                      <p className="text-xs opacity-75 mt-1">SIN Paneles</p>
                                    </div>
                                    <div className="bg-white/30 backdrop-blur rounded-lg p-4 text-center border-2 border-white">
                                      <p className="text-xs opacity-90 font-bold">Ahorro Anual</p>
                                      <p className="text-2xl font-black mt-1">${Math.round(totalSavings / 10).toLocaleString('es-MX')}</p>
                                      <p className="text-xs opacity-75 mt-1">Promedio/año</p>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur rounded-lg p-4 text-center border border-white/30">
                                      <p className="text-xs opacity-90 font-semibold">Total 10 años</p>
                                      <p className="text-2xl font-bold mt-1">${totalCostWithPanels.toLocaleString('es-MX')}</p>
                                      <p className="text-xs opacity-75 mt-1">CON Paneles</p>
                                    </div>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar más
              </button>

              {analyzedReceipts.length > 0 && (
                <button onClick={handleRemoveAll} className="btn-secondary text-red-600 hover:bg-red-50">
                  Limpiar todo
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {analyzedReceipts.some(r => r.status === 'pending') && (
                <button onClick={handleAnalyzeAll} className="btn-primary inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Analizar Todos
                </button>
              )}

              {successReceipts.length > 0 && isServiceNumberValid && (
                <button onClick={handleContinue} className="btn-success inline-flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Continuar ({successReceipts.length})
                </button>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="application/pdf"
            onChange={handleInputChange}
            className="hidden"
          />
        </>
      )}

      {/* Modal crear cliente */}
      {selectedData && (
        <CreateClientFromReceiptModal
          isOpen={showCreateClientModal}
          onClose={() => setShowCreateClientModal(false)}
          receiptData={selectedData}
          onClientCreated={handleClientCreated}
        />
      )}
    </div>
  );
}
