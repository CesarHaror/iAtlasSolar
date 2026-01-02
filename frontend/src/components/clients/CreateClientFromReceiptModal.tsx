// =====================================================
// MODAL - CREAR CLIENTE DESDE RECIBO CFE
// =====================================================

import { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Zap,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Hash,
} from 'lucide-react';
import { CFEReceiptData } from '@/hooks/useOCR';
import { useCreateClient } from '@/hooks/useClients';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface CreateClientFromReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: CFEReceiptData;
  onClientCreated?: (clientId: string) => void;
}

export default function CreateClientFromReceiptModal({
  isOpen,
  onClose,
  receiptData,
  onClientCreated,
}: CreateClientFromReceiptModalProps) {
  const createClient = useCreateClient();
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    cfeServiceNumber: '',
    cfeTariff: '' as string,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Prellenar datos del recibo cuando cambie
  useEffect(() => {
    if (receiptData) {
      setFormData({
        name: receiptData.clientName || '',
        email: '', // El email no está en el recibo
        phone: '', // El teléfono no está en el recibo
        address: receiptData.address || '',
        city: receiptData.city || '',
        state: receiptData.state || '',
        postalCode: receiptData.postalCode || '',
        cfeServiceNumber: receiptData.serviceNumber || '',
        cfeTariff: receiptData.tariff || '',
      });
    }
  }, [receiptData]);
  
  // Validar formulario
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.phone || formData.phone.length < 10) {
      newErrors.phone = 'El teléfono debe tener al menos 10 dígitos';
    }
    
    if (!formData.address) {
      newErrors.address = 'La dirección es requerida';
    }
    
    if (!formData.city) {
      newErrors.city = 'La ciudad es requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Manejar submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Por favor corrige los errores');
      return;
    }
    
    try {
      const result = await createClient.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state || undefined,
        postalCode: formData.postalCode || undefined,
        cfeServiceNumber: formData.cfeServiceNumber || undefined,
        cfeTariff: formData.cfeTariff as any || undefined,
      });
      
      if (result) {
        onClientCreated?.(result.id);
      }
      onClose();
      
    } catch (error: any) {
      console.error('Error creating client:', error);
      // El hook ya muestra el error
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Crear Cliente</h2>
              <p className="text-sm text-gray-500">Datos extraídos del recibo CFE</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Indicador de datos prellenados */}
        <div className="px-6 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Datos prellenados del recibo CFE
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Los campos marcados con ✓ fueron extraídos automáticamente. 
                Completa el email y teléfono para crear el cliente.
              </p>
            </div>
          </div>
        </div>
        
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" />
              Nombre completo *
              {receiptData.clientName && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre del cliente"
              className={cn(
                'input-field',
                errors.name && 'border-red-500 focus:ring-red-500'
              )}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>
          
          {/* Email y Teléfono */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4" />
                Email *
                <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                  Requerido
                </span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="cliente@ejemplo.com"
                className={cn(
                  'input-field',
                  errors.email && 'border-red-500 focus:ring-red-500'
                )}
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4" />
                Teléfono *
                <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                  Requerido
                </span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="10 dígitos"
                className={cn(
                  'input-field',
                  errors.phone && 'border-red-500 focus:ring-red-500'
                )}
              />
              {errors.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>
          </div>
          
          {/* Dirección */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4" />
              Dirección *
              {receiptData.address && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Calle, número, colonia"
              className={cn(
                'input-field',
                errors.address && 'border-red-500 focus:ring-red-500'
              )}
            />
            {errors.address && (
              <p className="text-sm text-red-600 mt-1">{errors.address}</p>
            )}
          </div>
          
          {/* Ciudad, Estado, CP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4" />
                Ciudad *
                {receiptData.city && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ciudad"
                className={cn(
                  'input-field',
                  errors.city && 'border-red-500 focus:ring-red-500'
                )}
              />
              {errors.city && (
                <p className="text-sm text-red-600 mt-1">{errors.city}</p>
              )}
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                Estado
                {receiptData.state && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Estado"
                className="input-field"
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                C.P.
                {receiptData.postalCode && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="00000"
                className="input-field"
              />
            </div>
          </div>
          
          {/* Datos CFE */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Datos CFE
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4" />
                  Número de Servicio
                  {receiptData.serviceNumber && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </label>
                <input
                  type="text"
                  value={formData.cfeServiceNumber}
                  onChange={(e) => setFormData({ ...formData, cfeServiceNumber: e.target.value })}
                  placeholder="Número de servicio CFE"
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Zap className="w-4 h-4" />
                  Tarifa CFE
                  {receiptData.tariff && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </label>
                <input
                  type="text"
                  value={formData.cfeTariff}
                  readOnly
                  className="input-field bg-gray-50"
                />
              </div>
            </div>
          </div>
          
          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={createClient.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary inline-flex items-center gap-2"
              disabled={createClient.isPending}
            >
              {createClient.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Crear Cliente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
