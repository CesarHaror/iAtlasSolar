// =====================================================
// DETALLE DE PROYECTO
// =====================================================

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Wrench,
  Zap,
  CheckCircle,
  XCircle,
  CreditCard,
  Sun,
} from 'lucide-react';
import { useProject, useChangeProjectStatus, type Payment } from '@/hooks/useProjects';
import RegisterPaymentModal from '@/components/projects/RegisterPaymentModal';

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

// Status badge
const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; className: string; icon: any }> = {
    PENDING_PAYMENT: { label: 'Pendiente Pago', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
    IN_PROGRESS: { label: 'En Instalación', className: 'bg-blue-100 text-blue-700', icon: Wrench },
    CFE_PROCESS: { label: 'Trámite CFE', className: 'bg-purple-100 text-purple-700', icon: Zap },
    COMPLETED: { label: 'Completado', className: 'bg-green-100 text-green-700', icon: CheckCircle },
    CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-700', icon: XCircle },
  };
  
  const { label, className, icon: Icon } = config[status] || config.PENDING_PAYMENT;
  
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${className}`}>
      <Icon className="w-4 h-4" />
      {label}
    </span>
  );
};

// Payment status badge
const PaymentStatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pendiente', className: 'bg-gray-100 text-gray-700' },
    PARTIAL: { label: 'Parcial', className: 'bg-yellow-100 text-yellow-700' },
    PAID: { label: 'Pagado', className: 'bg-green-100 text-green-700' },
    OVERDUE: { label: 'Vencido', className: 'bg-red-100 text-red-700' },
  };
  
  const { label, className } = config[status] || config.PENDING;
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  );
};

// Progress bar
const ProgressBar = ({ paid, total }: { paid: number; total: number }) => {
  const percent = total > 0 ? Math.round((paid / total) * 100) : 0;
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-500">Pagado: {formatCurrency(paid)}</span>
        <span className="font-medium text-gray-900">{percent}%</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Pendiente: {formatCurrency(total - paid)}</span>
        <span>Total: {formatCurrency(total)}</span>
      </div>
    </div>
  );
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  const { data: project, isLoading, error, refetch } = useProject(id!);
  const changeStatus = useChangeProjectStatus();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Cargando proyecto...</div>
      </div>
    );
  }
  
  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle className="w-12 h-12 text-red-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Proyecto no encontrado</h3>
        <Link to="/projects" className="text-orange-600 hover:underline">
          Volver a la lista
        </Link>
      </div>
    );
  }
  
  const handleChangeStatus = async (newStatus: string) => {
    if (confirm(`¿Cambiar el estado del proyecto a "${newStatus}"?`)) {
      await changeStatus.mutateAsync({ id: project.id, status: newStatus });
    }
  };
  
  const handlePaymentClick = (payment: Payment) => {
    if (payment.status !== 'PAID') {
      setSelectedPayment(payment);
      setShowPaymentModal(true);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {project.projectNumber}
              </h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-gray-500 mt-1">
              Cotización: {project.quotation.quoteNumber} | Proforma: {project.proforma.proformaNumber}
            </p>
          </div>
        </div>
        
        {/* Status Actions */}
        <div className="flex items-center gap-2">
          {project.status === 'PENDING_PAYMENT' && project.paidAmount > 0 && (
            <button
              onClick={() => handleChangeStatus('IN_PROGRESS')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Wrench className="w-4 h-4" />
              Iniciar Instalación
            </button>
          )}
          
          {project.status === 'IN_PROGRESS' && (
            <button
              onClick={() => handleChangeStatus('CFE_PROCESS')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Iniciar Trámite CFE
            </button>
          )}
          
          {project.status === 'CFE_PROCESS' && (
            <button
              onClick={() => handleChangeStatus('COMPLETED')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Marcar Completado
            </button>
          )}
        </div>
      </div>
      
      {/* Payment Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-gray-400" />
          Progreso de Pagos
        </h2>
        <ProgressBar paid={project.paidAmount} total={project.totalAmount} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" />
              Plan de Pagos
            </h2>
            <div className="space-y-3">
              {project.payments.map((payment, index) => (
                <div
                  key={payment.id}
                  onClick={() => handlePaymentClick(payment)}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                    payment.status === 'PAID' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200 hover:border-orange-300 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      payment.status === 'PAID'
                        ? 'bg-green-500 text-white'
                        : payment.status === 'PARTIAL'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {payment.status === 'PAID' ? '✓' : index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{payment.phaseLabel}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">
                          Esperado: {formatCurrency(payment.expectedAmount)}
                        </span>
                        {payment.paidAmount > 0 && (
                          <span className="text-green-600">
                            | Pagado: {formatCurrency(payment.paidAmount)}
                          </span>
                        )}
                      </div>
                      {payment.paidAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Pagado el {formatDate(payment.paidAt)}
                          {payment.paymentMethod && ` • ${payment.paymentMethod}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <PaymentStatusBadge status={payment.status} />
                    {payment.status !== 'PAID' && (
                      <p className="text-xs text-orange-600 mt-1">
                        Click para registrar pago
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* System Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sun className="w-5 h-5 text-gray-400" />
              Sistema Solar
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Capacidad</p>
                <p className="font-semibold text-gray-900">{project.systemSize} kW</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Paneles</p>
                <p className="font-semibold text-gray-900">{project.panelsQty} unidades</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Modelo Panel</p>
                <p className="font-semibold text-gray-900">
                  {project.quotation.panelBrand} {project.quotation.panelPower}W
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Inversor</p>
                <p className="font-semibold text-gray-900">
                  {project.quotation.inverterBrand} {project.quotation.inverterPower}kW
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Producción Mensual</p>
                <p className="font-semibold text-gray-900">
                  {project.quotation.monthlyProduction?.toFixed(0)} kWh
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ahorro Mensual</p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(project.quotation.monthlySavings || 0)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          {project.notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notas</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{project.notes}</p>
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              Cliente
            </h2>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">{project.client.name}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                {project.client.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                {project.client.phone}
              </div>
              {project.installationAddress && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span>{project.installationAddress}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Assigned To */}
          {project.assignedTo && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Asignado a</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{project.assignedTo.name}</p>
                  <p className="text-sm text-gray-500">{project.assignedTo.email}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Dates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              Fechas
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Creado</p>
                <p className="font-medium text-gray-900">{formatDate(project.createdAt)}</p>
              </div>
              {project.proforma.signedAt && (
                <div>
                  <p className="text-sm text-gray-500">Proforma firmada</p>
                  <p className="font-medium text-gray-900">{formatDate(project.proforma.signedAt)}</p>
                </div>
              )}
              {project.startDate && (
                <div>
                  <p className="text-sm text-gray-500">Inicio</p>
                  <p className="font-medium text-gray-900">{formatDate(project.startDate)}</p>
                </div>
              )}
              {project.estimatedEndDate && (
                <div>
                  <p className="text-sm text-gray-500">Fin estimado</p>
                  <p className="font-medium text-gray-900">{formatDate(project.estimatedEndDate)}</p>
                </div>
              )}
              {project.actualEndDate && (
                <div>
                  <p className="text-sm text-gray-500">Completado</p>
                  <p className="font-medium text-green-600">{formatDate(project.actualEndDate)}</p>
                </div>
              )}
              {project.cfeApprovalDate && (
                <div>
                  <p className="text-sm text-gray-500">Aprobación CFE</p>
                  <p className="font-medium text-gray-900">{formatDate(project.cfeApprovalDate)}</p>
                </div>
              )}
              {project.interconnectionDate && (
                <div>
                  <p className="text-sm text-gray-500">Interconexión</p>
                  <p className="font-medium text-green-600">{formatDate(project.interconnectionDate)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && selectedPayment && (
        <RegisterPaymentModal
          projectId={project.id}
          payment={selectedPayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPayment(null);
          }}
          onSuccess={() => {
            refetch();
            setShowPaymentModal(false);
            setSelectedPayment(null);
          }}
        />
      )}
    </div>
  );
}
