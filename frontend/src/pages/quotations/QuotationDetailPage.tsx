// =====================================================
// DETALLE DE COTIZACIÓN
// =====================================================

import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Send,
  Download,
  Printer,
  Share2,
  Loader2,
  Sun,
  Zap,
  DollarSign,
  Leaf,
  Clock,
  User,
  Settings,
  TrendingUp,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  Phone,
  Mail,
  Receipt,
} from 'lucide-react';
import { useQuotation, useUpdateQuotation, useDeleteQuotation, useDuplicateQuotation } from '@/hooks/useQuotations';
import { useCreateProforma } from '@/hooks/useProformas';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import SendModal from '@/components/quotations/SendModal';

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  DRAFT: { label: 'Borrador', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: FileText },
  SENT: { label: 'Enviada', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Send },
  VIEWED: { label: 'Vista', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock },
  APPROVED: { label: 'Aprobada', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  REJECTED: { label: 'Rechazada', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
  EXPIRED: { label: 'Expirada', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: AlertCircle },
};

export default function QuotationDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const { token } = useAuthStore();
  
  const { data: quotation, isLoading, error } = useQuotation(id || '');
  const updateQuotation = useUpdateQuotation();
  const deleteQuotation = useDeleteQuotation();
  const duplicateQuotation = useDuplicateQuotation();
  const createProforma = useCreateProforma();
  
  // Crear proforma desde cotización aprobada
  const handleCreateProforma = async () => {
    if (!id) return;
    try {
      const proforma = await createProforma.mutateAsync({ quotationId: id });
      navigate(`/proformas/${proforma.id}`);
      // Mostrar mensaje apropiado según si ya existía o se creó nueva
      if ((proforma as any).alreadyExisted) {
        toast('Se abrió la proforma existente', { icon: '📄' });
      } else {
        toast.success('Proforma creada exitosamente');
      }
    } catch (error) {
      // Error handled by hook
    }
  };
  
  // Función para descargar PDF
  const handleDownloadPDF = async () => {
    if (!id) return;
    
    setIsDownloadingPDF(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/quotations/${id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al generar PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion-${quotation?.quoteNumber?.replace(/\//g, '-') || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF descargado exitosamente');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error al descargar el PDF');
    } finally {
      setIsDownloadingPDF(false);
    }
  };
  
  // Función para imprimir (abre PDF en nueva ventana)
  const handlePrint = async () => {
    if (!id) return;
    
    try {
      window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/quotations/${id}/pdf/view?token=${token}`, '_blank');
    } catch (error) {
      console.error('Error opening PDF:', error);
      toast.error('Error al abrir el PDF');
    }
  };
  
  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    await updateQuotation.mutateAsync({ id, data: { status: newStatus as any } });
    setShowStatusMenu(false);
  };
  
  const handleDelete = async () => {
    if (!id) return;
    await deleteQuotation.mutateAsync(id);
    navigate('/quotations');
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }
  
  if (error || !quotation) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Cotización no encontrada</h2>
        <p className="text-gray-600 mb-4">La cotización que buscas no existe o fue eliminada.</p>
        <Link to="/quotations" className="btn-primary">
          Volver a Cotizaciones
        </Link>
      </div>
    );
  }
  
  const statusConfig = STATUS_CONFIG[quotation.status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = statusConfig.icon;
  const costBreakdown = quotation.costBreakdown as any || {};
  
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/quotations')}
            className="p-2 hover:bg-gray-100 rounded-lg mt-1"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{quotation.quoteNumber}</h1>
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className={cn(
                    'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium',
                    statusConfig.bgColor,
                    statusConfig.color
                  )}
                >
                  <StatusIcon className="w-4 h-4" />
                  {statusConfig.label}
                </button>
                
                {showStatusMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                    <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                      <div className="py-1">
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <button
                            key={key}
                            onClick={() => handleStatusChange(key)}
                            className={cn(
                              'flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50',
                              quotation.status === key && 'bg-gray-100'
                            )}
                          >
                            <config.icon className={cn('w-4 h-4', config.color)} />
                            {config.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <p className="text-gray-600 mt-1">
              Creada el {formatDate(quotation.createdAt)}
              {quotation.createdBy && ` por ${quotation.createdBy.name}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/quotations/${quotation.id}/edit`}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Editar
          </Link>
          <button 
            onClick={handlePrint}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
          <button 
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF}
            className="btn-secondary inline-flex items-center gap-2"
          >
            {isDownloadingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isDownloadingPDF ? 'Generando...' : 'PDF'}
          </button>
          <button
            onClick={() => setShowSendModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Enviar
          </button>
          {quotation.status === 'APPROVED' && (
            <button
              onClick={handleCreateProforma}
              disabled={createProforma.isPending}
              className="btn-secondary inline-flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
            >
              {createProforma.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Receipt className="w-4 h-4" />
              )}
              {createProforma.isPending ? 'Creando...' : 'Crear Proforma'}
            </button>
          )}
        </div>
      </div>
      
      {/* Resumen principal */}
      <div className="card bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Sistema de {quotation.systemSize} kWp</h2>
            <p className="text-white/80 mt-1">
              {quotation.panelsQty} paneles {quotation.panelBrand} • Inversor {quotation.inverterBrand}
            </p>
          </div>
          <Sun className="w-16 h-16 text-yellow-300" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-sm text-white/80">Precio Total</p>
            <p className="text-xl font-bold">{formatCurrency(quotation.salePrice)}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-sm text-white/80">Ahorro Mensual</p>
            <p className="text-xl font-bold">{formatCurrency(quotation.avgBill - (quotation.monthlyBillAfter || 0))}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-sm text-white/80">Retorno</p>
            <p className="text-xl font-bold">{(quotation.paybackYears * 12).toFixed(0)} meses</p>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-sm text-white/80">ROI 25 años</p>
            <p className="text-xl font-bold">{quotation.roi25Years}%</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos del cliente */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Cliente</h3>
            </div>
            
            {quotation.client && (
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-lg">{quotation.client.name}</p>
                  <div className="mt-2 space-y-1">
                    <p className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${quotation.client.email}`} className="text-primary-600 hover:underline">
                        {quotation.client.email}
                      </a>
                    </p>
                    <p className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${quotation.client.phone}`} className="text-primary-600 hover:underline">
                        {quotation.client.phone}
                      </a>
                    </p>
                  </div>
                </div>
                <Link
                  to={`/clients/${quotation.client.id}`}
                  className="btn-secondary text-sm"
                >
                  Ver perfil
                </Link>
              </div>
            )}
          </div>
          
          {/* Equipos */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Sistema Solar</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Paneles Solares</p>
                <p className="font-medium text-gray-900">{quotation.panelBrand} {quotation.panelModel}</p>
                <p className="text-sm text-gray-600">{quotation.panelPower}W × {quotation.panelsQty} unidades</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Inversor</p>
                <p className="font-medium text-gray-900">{quotation.inverterBrand} {quotation.inverterModel}</p>
                <p className="text-sm text-gray-600">{quotation.inverterPower} kW</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Tipo de Instalación</p>
                <p className="font-medium text-gray-900">{quotation.structureType || 'Techo'}</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">HSP Utilizado</p>
                <p className="font-medium text-gray-900">{quotation.hspUsed} h/día</p>
              </div>
            </div>
          </div>
          
          {/* Desglose de Costo por Panel */}
          <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Sun className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Desglose de Costo por Panel</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                <span className="text-gray-700">Precio unitario por panel:</span>
                <span className="text-xl font-bold text-orange-600">{formatCurrency(8500)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                <span className="text-gray-700">Cantidad de paneles:</span>
                <span className="text-xl font-bold text-gray-900">{quotation.panelsQty} unidades</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg border-2 border-orange-300">
                <span className="text-gray-900 font-bold text-lg">Total costo de paneles:</span>
                <span className="text-2xl font-bold text-orange-700">
                  {formatCurrency(quotation.panelsQty * 8500)}
                </span>
              </div>
              
              <p className="text-xs text-gray-600 italic text-center mt-4 pt-3 border-t border-orange-200">
                Incluye material, estructura base e instalación
              </p>
            </div>
          </div>
          
          {/* Producción y ahorro */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Producción y Ahorro</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Sun className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{quotation.monthlyProduction?.toLocaleString()}</p>
                <p className="text-sm text-gray-600">kWh/mes generados</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(quotation.avgBill - (quotation.monthlyBillAfter || 0))}</p>
                <p className="text-sm text-gray-600">Ahorro mensual</p>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Zap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{quotation.coveragePercent?.toFixed(0)}%</p>
                <p className="text-sm text-gray-600">Cobertura consumo</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Leaf className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{quotation.annualProduction?.toLocaleString()}</p>
                <p className="text-sm text-gray-600">kWh/año</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Comparativa de Recibo</h4>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Recibo Actual</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(quotation.avgBill)}/mes</p>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Con Solar</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(quotation.avgBill - quotation.monthlySavings)}/mes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Columna derecha */}
        <div className="space-y-6">

          
          {/* Desglose de inversión */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Inversión</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Paneles</span>
                <span>{formatCurrency(costBreakdown.panels || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Inversor</span>
                <span>{formatCurrency(costBreakdown.inverter || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estructura</span>
                <span>{formatCurrency(costBreakdown.structure || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Instalación</span>
                <span>{formatCurrency(costBreakdown.installation || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Material eléctrico</span>
                <span>{formatCurrency(costBreakdown.electrical || 0)}</span>
              </div>
              
              {quotation.discount && quotation.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento</span>
                  <span>-{formatCurrency(quotation.discount)}</span>
                </div>
              )}
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA (16%)</span>
                  <span>{formatCurrency(costBreakdown.iva || 0)}</span>
                </div>
              </div>
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary-600">{formatCurrency(quotation.salePrice)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Datos CFE */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Datos CFE</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tarifa</span>
                <span className="font-medium">{quotation.tariff}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Consumo mensual</span>
                <span className="font-medium">{quotation.monthlyConsumption} kWh</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Recibo promedio</span>
                <span className="font-medium">{formatCurrency(quotation.avgBill)}</span>
              </div>
            </div>
          </div>
          
          {/* Validez */}
          <div className="card bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Válida hasta</p>
                <p className="text-sm text-yellow-700">
                  {quotation.validUntil ? formatDate(quotation.validUntil) : 'Sin fecha límite'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Notas */}
          {(quotation.notes || quotation.clientNotes) && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Notas</h3>
              {quotation.clientNotes && (
                <div className="mb-3">
                  <p className="text-sm text-gray-500">Para el cliente:</p>
                  <p className="text-gray-700">{quotation.clientNotes}</p>
                </div>
              )}
              {quotation.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notas internas:</p>
                  <p className="text-gray-700">{quotation.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Eliminar cotización?
              </h3>
              <p className="text-gray-600 mb-6">
                Esta acción no se puede deshacer. La cotización {quotation.quoteNumber} será eliminada permanentemente.
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteQuotation.isPending}
                  className="btn-primary bg-red-600 hover:bg-red-700 inline-flex items-center gap-2"
                >
                  {deleteQuotation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de envío */}
      <SendModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        quotation={{
          id: quotation.id,
          quoteNumber: quotation.quoteNumber,
          systemSize: quotation.systemSize,
          salePrice: quotation.salePrice,
          client: quotation.client,
        }}
      />
    </div>
  );
}
