import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuotation, useUpdateQuotation } from '@/hooks/useQuotations';
import {
  ArrowLeft,
  Save,
  Calculator,
  Percent,
  StickyNote,
  Sun,
  Zap,
  DollarSign,
  FileText,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'SENT', label: 'Enviada' },
  { value: 'VIEWED', label: 'Visualizada' },
  { value: 'APPROVED', label: 'Aprobada' },
  { value: 'REJECTED', label: 'Rechazada' },
  { value: 'EXPIRED', label: 'Expirada' },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

export default function EditQuotationPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: quotation, isLoading, error } = useQuotation(id || '');
  const updateQuotation = useUpdateQuotation();
  
  const [formData, setFormData] = useState({
    status: 'DRAFT',
    monthlyConsumption: 0,
    avgBill: 0,
    tariff: '',
    systemSize: 0,
    panelsQty: 0,
    monthlyProduction: 0,
    annualProduction: 0,
    realCost: 0,
    salePrice: 0,
    discount: 0,
    notes: '',
    clientNotes: '',
    monthlySavings: 0,
    annualSavings: 0,
    paybackYears: 0,
    roi25Years: 0,
  });

  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);

  // ✅ CARGAR DATOS DESDE EL SERVIDOR
  useEffect(() => {
    if (quotation) {
      console.log('%c=== CARGANDO DATOS DE COTIZACIÓN ===', 'background: purple; color: white; padding: 10px;');
      console.log('📦 quotation:', quotation);
      
      setFormData({
        status: quotation.status || 'DRAFT',
        monthlyConsumption: quotation.monthlyConsumption || 0,
        avgBill: quotation.avgBill || 0,
        tariff: quotation.tariff || '',
        systemSize: quotation.systemSize || 0,
        panelsQty: quotation.panelsQty || 0,
        monthlyProduction: quotation.monthlyProduction || 0,
        annualProduction: quotation.annualProduction || 0,
        realCost: quotation.realCost || 0,
        salePrice: quotation.salePrice || 0,
        discount: quotation.discount || 0,
        notes: quotation.notes || '',
        clientNotes: quotation.clientNotes || '',
        monthlySavings: quotation.monthlySavings || 0,
        annualSavings: quotation.annualSavings || 0,
        paybackYears: quotation.paybackYears || 0,
        roi25Years: quotation.roi25Years || 0,
      });
      
      console.log('%c✅ FORMULARIO CARGADO CORRECTAMENTE', 'background: green; color: white; padding: 10px;');
    }
  }, [quotation]);

  // Calcular descuento y precio final
  useEffect(() => {
    if (formData.salePrice > 0) {
      const discountAmount = (formData.salePrice * formData.discount) / 100;
      const finalPrice = formData.salePrice - discountAmount;
      setDiscountAmount(discountAmount);
      setFinalPrice(finalPrice);
    }
  }, [formData.salePrice, formData.discount]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    try {
      console.log('%c=== ENVIANDO ACTUALIZACIÓN ===', 'background: orange; color: white; padding: 10px;');
      console.log('📦 Datos a guardar:', formData);
      
      await updateQuotation.mutateAsync({ 
        id, 
        data: formData 
      });
      
      toast.success('Cotización actualizada exitosamente');
      navigate(`/quotations/${id}`);
    } catch (error) {
      toast.error('Error al actualizar la cotización');
      console.error('Error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Cargando cotización...</span>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Cotización no encontrada
        </h2>
        <button
          onClick={() => navigate('/quotations')}
          className="text-blue-600 hover:text-blue-700"
        >
          Volver a cotizaciones
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/quotations/${id}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            Editar Cotización
          </h1>
          <p className="text-gray-600 mt-1">
            {quotation.quoteNumber} - Cliente: {quotation.client?.name || 'N/A'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sistema Solar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sun className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Especificaciones del Sistema
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Zap className="w-4 h-4 inline mr-1" />
                Tamaño del Sistema (kW)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.systemSize}
                onChange={(e) => handleInputChange('systemSize', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 5.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Sun className="w-4 h-4 inline mr-1" />
                Paneles Totales
              </label>
              <input
                type="number"
                min="0"
                value={formData.panelsQty}
                onChange={(e) => handleInputChange('panelsQty', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Zap className="w-4 h-4 inline mr-1" />
                Producción Mensual (kWh)
              </label>
              <input
                type="number"
                min="0"
                value={formData.monthlyProduction}
                onChange={(e) => handleInputChange('monthlyProduction', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 650"
              />
            </div>
          </div>

          {/* Desglose de Costo por Panel */}
          {formData.panelsQty > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <Sun className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-gray-900">Desglose de Costo por Panel</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Precio unitario por panel:</span>
                  <span className="font-semibold text-orange-700">{formatCurrency(8500)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Cantidad de paneles:</span>
                  <span className="font-semibold text-gray-900">{formData.panelsQty} un.</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-orange-300">
                  <span className="text-gray-900 font-bold">Total paneles:</span>
                  <span className="text-lg font-bold text-orange-600">
                    {formatCurrency(formData.panelsQty * 8500)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 italic mt-2">
                  Incluye material e instalación
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Consumo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Datos de Consumo
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consumo Mensual (kWh)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.monthlyConsumption}
                onChange={(e) => handleInputChange('monthlyConsumption', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recibo Bimensual ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.avgBill}
                onChange={(e) => handleInputChange('avgBill', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 1500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tarifa CFE
              </label>
              <input
                type="text"
                value={formData.tariff}
                onChange={(e) => handleInputChange('tariff', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: GDMTO"
              />
            </div>
          </div>
        </div>

        {/* Precios y Descuento */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Precio y Descuento
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Original (MXN)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.salePrice}
                  onChange={(e) => handleInputChange('salePrice', parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="150000.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descuento (%)
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.discount}
                  onChange={(e) => handleInputChange('discount', parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          {/* Resumen de Precio */}
          {formData.salePrice > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">Precio original:</span>
                  <span className="text-gray-600">
                    {formatCurrency(formData.salePrice)}
                  </span>
                </div>
                
                {formData.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 font-medium">
                      Descuento ({formData.discount}%):
                    </span>
                    <span className="text-red-600 font-semibold">
                      -{formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-green-300">
                  <span className="text-gray-900">Precio Final:</span>
                  <span className="text-green-600">
                    {formatCurrency(finalPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Retorno de Inversión */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Retorno de Inversión
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payback Period (años)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.paybackYears}
                onChange={(e) => handleInputChange('paybackYears', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="9.75"
              />
              <p className="text-xs text-gray-500 mt-1">
                {(formData.paybackYears * 12).toFixed(0)} meses
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ROI a 25 años (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.roi25Years}
                onChange={(e) => handleInputChange('roi25Years', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="250.00"
              />
            </div>
          </div>

          {/* Resumen Visual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Payback Period</p>
              <p className="text-2xl font-bold text-blue-600">
                {(formData.paybackYears * 12).toFixed(0)} meses
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ({formData.paybackYears.toFixed(2)} años)
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">ROI a 25 años</p>
              <p className="text-2xl font-bold text-green-600">
                {formData.roi25Years.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Retorno sobre inversión
              </p>
            </div>
          </div>

          {formData.realCost > 0 && formData.monthlySavings > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Cálculo:</strong> ${formData.realCost.toLocaleString()} (inversión) ÷ ${(formData.monthlySavings || (formData.avgBill - (quotation?.monthlyBillAfter || 0))).toLocaleString()} (ahorro mensual)
              </p>
            </div>
          )}
        </div>

        {/* Estado */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Estado de la Cotización
            </h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado Actual
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <StickyNote className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Notas y Observaciones
            </h3>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas Internas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Notas solo visibles para el equipo interno..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas para el Cliente
            </label>
            <textarea
              value={formData.clientNotes}
              onChange={(e) => handleInputChange('clientNotes', e.target.value)}
              placeholder="Incluye información adicional relevante para el cliente, términos especiales, garantías, etc."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(`/quotations/${id}`)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={updateQuotation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateQuotation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}