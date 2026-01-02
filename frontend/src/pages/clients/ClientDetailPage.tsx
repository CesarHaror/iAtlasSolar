// =====================================================
// DETALLE DE CLIENTE
// =====================================================

import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Zap,
  Calendar,
  Calculator,
  FolderOpen,
  Plus,
  MoreVertical,
  Eye,
} from 'lucide-react';
import { useClient, useDeleteClient } from '@/hooks/useClients';
import { formatDate, cn } from '@/lib/utils';

const CFE_TARIFF_NAMES: Record<string, string> = {
  T1: 'Tarifa 1 - Templada',
  T1A: 'Tarifa 1A - Mínimo 25°C',
  T1B: 'Tarifa 1B - Mínimo 28°C',
  T1C: 'Tarifa 1C - Mínimo 30°C',
  T1D: 'Tarifa 1D - Mínimo 31°C',
  T1E: 'Tarifa 1E - Mínimo 32°C',
  T1F: 'Tarifa 1F - Mínimo 33°C',
  DAC: 'DAC - Alto Consumo (Sin subsidio)',
  GDMTO: 'GDMTO - Media Tensión Ordinaria (<100kW)',
  GDMTH: 'GDMTH - Media Tensión Horaria (≥100kW)',
};

export default function ClientDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: client, isLoading, error } = useClient(id || '');
  const deleteClient = useDeleteClient();

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await deleteClient.mutateAsync(id);
      navigate('/clients');
    } catch {
      // Error ya manejado en el hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Cliente no encontrado</h2>
        <p className="text-gray-600 mb-4">El cliente que buscas no existe o fue eliminado.</p>
        <Link to="/clients" className="btn-primary">
          Volver a Clientes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-600">
                {client.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              <p className="text-gray-600">
                Cliente desde {formatDate(client.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/clients/${id}/edit`}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-secondary inline-flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Cotizaciones</p>
              <p className="text-xl font-bold text-gray-900">
                {client.quotations?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Proyectos</p>
              <p className="text-xl font-bold text-gray-900">
                {client.projects?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tarifa CFE</p>
              <p className="text-xl font-bold text-gray-900">
                {client.cfeTariff || '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Actualizado</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(client.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Información del cliente */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos de contacto */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Datos de Contacto</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a href={`mailto:${client.email}`} className="text-primary-600 hover:underline">
                    {client.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <a href={`tel:${client.phone}`} className="text-primary-600 hover:underline">
                    {client.phone}
                  </a>
                </div>
              </div>

              {client.rfc && (
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">RFC</p>
                    <p className="text-gray-900">{client.rfc}</p>
                  </div>
                </div>
              )}

              {client.source && (
                <div className="flex items-center gap-3">
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Origen</p>
                    <p className="text-gray-900">{client.source}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dirección */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-secondary-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Dirección</h2>
            </div>

            <div className="space-y-2">
              <p className="text-gray-900">{client.address}</p>
              <p className="text-gray-600">
                {client.city}
                {client.state && `, ${client.state}`}
                {client.postalCode && ` - CP ${client.postalCode}`}
              </p>
            </div>
          </div>

          {/* Datos CFE */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Datos CFE</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Número de Servicio</p>
                <p className="text-gray-900">{client.cfeServiceNumber || 'No registrado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tarifa</p>
                <p className="text-gray-900">
                  {client.cfeTariff 
                    ? CFE_TARIFF_NAMES[client.cfeTariff] || client.cfeTariff 
                    : 'No registrada'}
                </p>
              </div>
            </div>
          </div>

          {/* Notas */}
          {client.notes && (
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Notas</h2>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Columna derecha - Acciones y actividad */}
        <div className="space-y-6">
          {/* Acciones rápidas */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="space-y-3">
              <Link
                to={`/quotations/new?clientId=${id}`}
                className="w-full btn-primary inline-flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nueva Cotización
              </Link>
              <a
                href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn-secondary inline-flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar WhatsApp
              </a>
              <a
                href={`mailto:${client.email}`}
                className="w-full btn-secondary inline-flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Enviar Email
              </a>
            </div>
          </div>

          {/* Cotizaciones recientes */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cotizaciones</h3>
              <Link
                to={`/quotations?clientId=${id}`}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Ver todas
              </Link>
            </div>

            {client.quotations && client.quotations.length > 0 ? (
              <div className="space-y-3">
                {client.quotations.slice(0, 3).map((quotation: any) => (
                  <Link
                    key={quotation.id}
                    to={`/quotations/${quotation.id}`}
                    className="block p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {quotation.systemSize} kWp
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(quotation.createdAt)}
                        </p>
                      </div>
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        quotation.status === 'APPROVED' && 'bg-green-100 text-green-700',
                        quotation.status === 'PENDING' && 'bg-yellow-100 text-yellow-700',
                        quotation.status === 'REJECTED' && 'bg-red-100 text-red-700',
                        quotation.status === 'DRAFT' && 'bg-gray-100 text-gray-700',
                      )}>
                        {quotation.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Calculator className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>Sin cotizaciones</p>
              </div>
            )}
          </div>

          {/* Proyectos */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Proyectos</h3>
              <Link
                to={`/projects?clientId=${id}`}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Ver todos
              </Link>
            </div>

            {client.projects && client.projects.length > 0 ? (
              <div className="space-y-3">
                {client.projects.slice(0, 3).map((project: any) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="block p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(project.createdAt)}
                        </p>
                      </div>
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>Sin proyectos</p>
              </div>
            )}
          </div>
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
                ¿Eliminar cliente?
              </h3>
              <p className="text-gray-600 mb-6">
                Esta acción no se puede deshacer. Se eliminarán todos los datos del cliente,
                incluyendo cotizaciones y proyectos asociados.
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
                  disabled={deleteClient.isPending}
                  className="btn-primary bg-red-600 hover:bg-red-700 inline-flex items-center gap-2"
                >
                  {deleteClient.isPending ? (
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
    </div>
  );
}
