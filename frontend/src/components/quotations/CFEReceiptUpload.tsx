// =====================================================
// COMPONENTE UPLOAD DE RECIBO CFE
// =====================================================

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
} from 'lucide-react';
import { useAnalyzeReceipt, CFEReceiptData, useOCRStatus } from '@/hooks/useOCR';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import CreateClientFromReceiptModal from '@/components/clients/CreateClientFromReceiptModal';

// Función para formatear la tarifa para mostrarla de forma amigable
// T01 → 01, T1 → 1, T1A → 1A, etc.
const formatTariffDisplay = (tariff: string): string => {
  if (!tariff) return '';
  // Si empieza con T seguido de número, quitar la T
  if (/^T\d/.test(tariff)) {
    return tariff.substring(1);
  }
  return tariff;
};

interface CFEReceiptUploadProps {
  onDataExtracted: (data: CFEReceiptData) => void;
  onClose?: () => void;
  onClientCreated?: (clientId: string) => void;
  className?: string;
}

export default function CFEReceiptUpload({
  onDataExtracted,
  onClose,
  onClientCreated,
  className,
}: CFEReceiptUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [extractedData, setExtractedData] = useState<CFEReceiptData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: ocrStatus, isLoading: checkingStatus } = useOCRStatus();
  const analyzeReceipt = useAnalyzeReceipt();
  
  // Manejar selección de archivo
  const handleFileSelect = useCallback((file: File) => {
    // Validar tipo (solo PDF)
    if (file.type !== 'application/pdf') {
      toast.error('Formato no válido. Solo se aceptan archivos PDF');
      return;
    }
    
    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es muy grande. Máximo 10MB');
      return;
    }
    
    setSelectedFile(file);
    
    // No hay preview para PDF, solo mostrar nombre
    setPreviewUrl('pdf-selected');
  }, []);
  
  // Manejar drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);
  
  // Manejar input de archivo
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);
  
  // Analizar recibo
  const handleAnalyze = async () => {
    if (!selectedFile) return;
    
    try {
      const result = await analyzeReceipt.mutateAsync(selectedFile);
      
      if (result.confidence >= 70) {
        toast.success(`¡Recibo analizado! (${result.confidence}% confianza)`);
      } else if (result.confidence >= 50) {
        toast('Recibo analizado con confianza media', { icon: '⚠️' });
      } else {
        toast('Algunos datos pueden ser incorrectos', { icon: '⚠️' });
      }
      
      // Guardar datos extraídos para poder crear cliente
      setExtractedData(result);
      onDataExtracted(result);
      
    } catch (error: any) {
      console.error('Error analyzing receipt:', error);
      toast.error(error.response?.data?.error?.message || 'Error al analizar el recibo');
    }
  };
  
  // Manejar cliente creado
  const handleClientCreated = (clientId: string) => {
    setShowCreateClientModal(false);
    onClientCreated?.(clientId);
    toast.success('Cliente creado y seleccionado');
  };
  
  // Limpiar selección
  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
              El cálculo automático de recibos CFE no está configurado.
              Ingresa los datos manualmente.
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
            <h3 className="font-semibold text-gray-900">Cálculo Automático</h3>
            <p className="text-sm text-gray-500">Sube tu recibo CFE y extraemos los datos</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>
      
      {/* Zona de upload o preview */}
      {!previewUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
            isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleInputChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
              isDragging ? 'bg-primary-100' : 'bg-gray-100'
            )}>
              {isDragging ? (
                <Upload className="w-8 h-8 text-primary-500" />
              ) : (
                <FileText className="w-8 h-8 text-gray-400" />
              )}
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-700">
                {isDragging ? 'Suelta el PDF aquí' : 'Arrastra tu recibo CFE aquí'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                o haz clic para seleccionar un archivo PDF
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <File className="w-4 h-4" />
              <span>Solo archivos PDF • Máximo 10MB</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Preview del PDF */}
          <div className="relative rounded-xl overflow-hidden bg-gray-100 p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-red-100 rounded-xl flex items-center justify-center">
                <FileText className="w-10 h-10 text-red-500" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900">{selectedFile?.name}</p>
                <p className="text-sm text-gray-500">
                  {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            {/* Overlay de análisis */}
            {analyzeReceipt.isPending && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white rounded-xl p-6 text-center">
                  <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto" />
                  <p className="mt-3 font-medium text-gray-900">Analizando PDF...</p>
                  <p className="text-sm text-gray-500">Extrayendo datos del recibo</p>
                </div>
              </div>
            )}
            
            {/* Overlay de éxito */}
            {analyzeReceipt.isSuccess && (
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                <div className="bg-white rounded-xl p-6 text-center">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
                  <p className="mt-3 font-medium text-gray-900">¡Cálculo completado!</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Botón para quitar archivo */}
          <button
            onClick={handleClear}
            disabled={analyzeReceipt.isPending}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}
      
      {/* Resultado del análisis */}
      {analyzeReceipt.isSuccess && analyzeReceipt.data && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800">
                Datos extraídos ({analyzeReceipt.data.confidence}% confianza)
              </span>
              {analyzeReceipt.data.consumption?.history && analyzeReceipt.data.consumption.history.length > 0 && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-1">
                  {analyzeReceipt.data.consumption.history.length} periodos
                </span>
              )}
            </div>
            
            {/* Botón crear cliente */}
            <button
              onClick={() => setShowCreateClientModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Crear Cliente
            </button>
          </div>
          
          {/* Datos en grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Tarifa */}
            {analyzeReceipt.data.tariff && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tarifa</p>
                  <p className="font-semibold text-gray-900">{formatTariffDisplay(analyzeReceipt.data.tariff)}</p>
                </div>
              </div>
            )}
            
            {/* Consumo promedio */}
            {analyzeReceipt.data.consumption.monthly && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Consumo promedio</p>
                  <p className="font-semibold text-gray-900">{analyzeReceipt.data.consumption.monthly.toLocaleString()} kWh/mes</p>
                </div>
              </div>
            )}
            
            {/* Gasto promedio */}
            {(analyzeReceipt.data.billing?.averageAmount || analyzeReceipt.data.billing?.totalAmount) && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Gasto promedio</p>
                  <p className="font-semibold text-gray-900">
                    ${(analyzeReceipt.data.billing.averageAmount || analyzeReceipt.data.billing.totalAmount)?.toLocaleString()}/mes
                  </p>
                </div>
              </div>
            )}
            
            {/* Ubicación */}
            {analyzeReceipt.data.city && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ubicación</p>
                  <p className="font-semibold text-gray-900 truncate">{analyzeReceipt.data.city}, {analyzeReceipt.data.state}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Número de servicio */}
          {analyzeReceipt.data.serviceNumber && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-xs text-gray-500">
                Servicio CFE: <span className="font-medium text-gray-700">{analyzeReceipt.data.serviceNumber}</span>
              </p>
            </div>
          )}
          
          {/* Warnings */}
          {analyzeReceipt.data.warnings.length > 0 && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-xs text-yellow-700 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {analyzeReceipt.data.warnings.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Error */}
      {analyzeReceipt.isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-800">Error al analizar</span>
          </div>
          <p className="text-sm text-red-600 mt-1">
            {(analyzeReceipt.error as any)?.response?.data?.error?.message ||
              analyzeReceipt.error.message ||
              'No se pudo analizar el recibo'}
          </p>
        </div>
      )}
      
      {/* Botones de acción */}
      {selectedFile && !analyzeReceipt.isSuccess && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleClear}
            disabled={analyzeReceipt.isPending}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={handleAnalyze}
            disabled={analyzeReceipt.isPending}
            className="btn-primary inline-flex items-center gap-2"
          >
            {analyzeReceipt.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analizar Recibo
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Modal para crear cliente */}
      {extractedData && (
        <CreateClientFromReceiptModal
          isOpen={showCreateClientModal}
          onClose={() => setShowCreateClientModal(false)}
          receiptData={extractedData}
          onClientCreated={handleClientCreated}
        />
      )}
    </div>
  );
}
