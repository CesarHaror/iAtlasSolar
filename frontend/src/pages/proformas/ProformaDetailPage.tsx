// =====================================================
// DETALLE DE PROFORMA
// =====================================================

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Send,
  Download,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  PenTool,
  FolderPlus,
} from 'lucide-react';
import { useProforma, useSendProforma, useCancelProforma } from '@/hooks/useProformas';
import { useCreateProject } from '@/hooks/useProjects';
import SignatureModal from '@/components/proformas/SignatureModal';

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
    DRAFT: { label: 'Borrador', className: 'bg-gray-100 text-gray-700', icon: FileText },
    SENT: { label: 'Enviada', className: 'bg-blue-100 text-blue-700', icon: Send },
    PENDING_SIGNATURE: { label: 'Pendiente Firma', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
    SIGNED: { label: 'Firmada', className: 'bg-green-100 text-green-700', icon: CheckCircle },
    CANCELLED: { label: 'Cancelada', className: 'bg-red-100 text-red-700', icon: XCircle },
  };
  
  const { label, className, icon: Icon } = config[status] || config.DRAFT;
  
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${className}`}>
      <Icon className="w-4 h-4" />
      {label}
    </span>
  );
};

export default function ProformaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  
  const { data: proforma, isLoading, error } = useProforma(id!);
  const sendProforma = useSendProforma();
  const cancelProforma = useCancelProforma();
  const createProject = useCreateProject();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Cargando proforma...</div>
      </div>
    );
  }
  
  if (error || !proforma) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle className="w-12 h-12 text-red-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Proforma no encontrada</h3>
        <Link to="/proformas" className="text-orange-600 hover:underline">
          Volver a la lista
        </Link>
      </div>
    );
  }
  
  const handleSend = async () => {
    if (confirm('¿Enviar esta proforma al cliente?')) {
      await sendProforma.mutateAsync(proforma.id);
    }
  };
  
  const handleCancel = async () => {
    const reason = prompt('Motivo de cancelación:');
    if (reason !== null) {
      await cancelProforma.mutateAsync({ id: proforma.id, reason });
      navigate('/proformas');
    }
  };
  
  const handleCreateProject = async () => {
    if (confirm('¿Crear proyecto a partir de esta proforma firmada?')) {
      const project = await createProject.mutateAsync({ proformaId: proforma.id });
      if (project) {
        navigate(`/projects/${project.id}`);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/proformas')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {proforma.proformaNumber}
              </h1>
              <StatusBadge status={proforma.status} />
            </div>
            <p className="text-gray-500 mt-1">
              Cotización: {proforma.quotation.quoteNumber}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {proforma.status === 'DRAFT' && (
            <button
              onClick={handleSend}
              disabled={sendProforma.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Enviar
            </button>
          )}
          
          {(proforma.status === 'SENT' || proforma.status === 'PENDING_SIGNATURE') && (
            <button
              onClick={() => setShowSignatureModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <PenTool className="w-4 h-4" />
              Firmar
            </button>
          )}
          
          {proforma.status === 'SIGNED' && !proforma.project && (
            <button
              onClick={handleCreateProject}
              disabled={createProject.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              <FolderPlus className="w-4 h-4" />
              Crear Proyecto
            </button>
          )}
          
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            PDF
          </button>
          
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
          
          {proforma.status !== 'SIGNED' && proforma.status !== 'CANCELLED' && (
            <button
              onClick={handleCancel}
              disabled={cancelProforma.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Cancelar
            </button>
          )}
        </div>
      </div>
      
      {/* Project Link */}
      {proforma.project && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">
              Proyecto creado: <strong>{proforma.project.projectNumber}</strong>
            </span>
          </div>
          <Link
            to={`/projects/${proforma.project.id}`}
            className="text-green-600 hover:underline font-medium"
          >
            Ver proyecto →
          </Link>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              Datos del Cliente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium text-gray-900">{proforma.client.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {proforma.client.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {proforma.client.phone}
                </p>
              </div>
              {proforma.client.city && (
                <div>
                  <p className="text-sm text-gray-500">Ciudad</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {proforma.client.city}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Payment Plan */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              Plan de Pagos
            </h2>
            <div className="space-y-3">
              {proforma.paymentPlan.map((plan, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-medium text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{plan.label}</p>
                      <p className="text-sm text-gray-500">{plan.percent}%</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(plan.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Terms */}
          {proforma.termsConditions && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Términos y Condiciones
              </h2>
              <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap">
                {proforma.termsConditions}
              </div>
            </div>
          )}
          
          {/* Signature */}
          {proforma.signatureImage && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-gray-400" />
                Firma Digital
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <img
                  src={proforma.signatureImage}
                  alt="Firma del cliente"
                  className="max-h-32 mx-auto"
                />
                <div className="text-center mt-4 text-sm text-gray-500">
                  <p className="font-medium text-gray-900">{proforma.signedByName}</p>
                  <p>{proforma.signedByEmail}</p>
                  {proforma.signedAt && (
                    <p className="mt-1">
                      Firmado el {formatDate(proforma.signedAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Totals */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(proforma.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">IVA (16%)</span>
                <span className="font-medium">{formatCurrency(proforma.iva)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-lg font-bold text-orange-600">
                  {formatCurrency(proforma.total)}
                </span>
              </div>
            </div>
          </div>
          
          {/* System Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sistema Solar</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Capacidad</p>
                <p className="font-medium text-gray-900">
                  {proforma.quotation.systemSize} kW
                </p>
              </div>
              {proforma.quotation.panelsQty && (
                <div>
                  <p className="text-sm text-gray-500">Paneles</p>
                  <p className="font-medium text-gray-900">
                    {proforma.quotation.panelsQty} × {proforma.quotation.panelBrand} {proforma.quotation.panelModel}
                  </p>
                </div>
              )}
              {proforma.quotation.inverterBrand && (
                <div>
                  <p className="text-sm text-gray-500">Inversor</p>
                  <p className="font-medium text-gray-900">
                    {proforma.quotation.inverterBrand} {proforma.quotation.inverterModel}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Dates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              Fechas
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Creada</p>
                <p className="font-medium text-gray-900">
                  {formatDate(proforma.createdAt)}
                </p>
              </div>
              {proforma.validUntil && (
                <div>
                  <p className="text-sm text-gray-500">Válida hasta</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(proforma.validUntil)}
                  </p>
                </div>
              )}
              {proforma.sentAt && (
                <div>
                  <p className="text-sm text-gray-500">Enviada</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(proforma.sentAt)}
                  </p>
                </div>
              )}
              {proforma.signedAt && (
                <div>
                  <p className="text-sm text-gray-500">Firmada</p>
                  <p className="font-medium text-green-600">
                    {formatDate(proforma.signedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Signature Modal */}
      {showSignatureModal && (
        <SignatureModal
          proformaId={proforma.id}
          clientEmail={proforma.client.email}
          onClose={() => setShowSignatureModal(false)}
        />
      )}
    </div>
  );
}
