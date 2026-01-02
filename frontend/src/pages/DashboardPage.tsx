// =====================================================
// PÁGINA DE DASHBOARD - DATOS REALES
// =====================================================

import { 
  FileText, 
  Users, 
  DollarSign,
  Plus,
  ArrowUpRight,
  Receipt,
  Folder,
  TrendingUp,
  Loader2,
  CheckCircle,
  Eye,
  Send
} from 'lucide-react';
import { useUser } from '@/stores/authStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { useQuotationStats, useQuotations } from '@/hooks/useQuotations';
import { useClientStats } from '@/hooks/useClients';
import { useProjectStats } from '@/hooks/useProjects';
import { useProformaStats } from '@/hooks/useProformas';

// Colores de estado para cotizaciones
const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  VIEWED: 'bg-purple-100 text-purple-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-orange-100 text-orange-700',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  VIEWED: 'Vista',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
};

export default function DashboardPage() {
  const user = useUser();
  const navigate = useNavigate();
  
  // Obtener estadísticas reales
  const { data: quotationStats, isLoading: loadingQuotations } = useQuotationStats();
  const { data: clientStats, isLoading: loadingClients } = useClientStats();
  const { data: projectStats, isLoading: loadingProjects } = useProjectStats();
  const { data: proformaStats, isLoading: loadingProformas } = useProformaStats();
  
  // Obtener cotizaciones recientes
  const { data: recentQuotationsData, isLoading: loadingRecent } = useQuotations({ 
    limit: 5,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const recentQuotations = recentQuotationsData?.data || [];
  
  const isLoading = loadingQuotations || loadingClients || loadingProjects || loadingProformas;

  // Calcular subtextos
  const approvedCount = quotationStats?.byStatus?.approved || 0;
  const projectsTotal = projectStats?.total || 0;
  const conversionRate = quotationStats?.conversionRate || 0;

  // Estadísticas principales
  const stats = [
    {
      label: 'Total Cotizaciones',
      value: quotationStats?.total || 0,
      subtext: approvedCount + ' aprobadas',
      icon: FileText,
      color: 'bg-blue-500',
      link: '/quotations',
    },
    {
      label: 'Proyectos Activos',
      value: projectStats?.byStatus?.inProgress || 0,
      subtext: projectsTotal + ' total',
      icon: Folder,
      color: 'bg-primary-500',
      link: '/projects',
    },
    {
      label: 'Clientes',
      value: clientStats?.total || 0,
      subtext: 'Registrados',
      icon: Users,
      color: 'bg-secondary-500',
      link: '/clients',
    },
    {
      label: 'Ventas Aprobadas',
      value: formatCurrency(quotationStats?.approvedAmount || 0),
      subtext: conversionRate + '% conversión',
      icon: DollarSign,
      color: 'bg-green-500',
      link: '/quotations?status=APPROVED',
    },
  ];

  // Calcular pendientes
  const pendingDrafts = quotationStats?.byStatus?.draft || 0;
  const pendingViewed = quotationStats?.byStatus?.viewed || 0;
  const pendingProformas = proformaStats?.byStatus?.draft || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Hola, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Aquí está el resumen de tu actividad
          </p>
        </div>
        <Link
          to="/quotations/new"
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Cotización
        </Link>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                <div className="w-16 h-4 bg-gray-200 rounded" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="w-20 h-8 bg-gray-200 rounded" />
                <div className="w-32 h-4 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Link 
              key={stat.label} 
              to={stat.link}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <span className="flex items-center text-sm font-medium text-primary-600">
                  Ver más
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cotizaciones Recientes */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Cotizaciones Recientes
            </h2>
            <Link
              to="/quotations"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Ver todas
            </Link>
          </div>

          {loadingRecent ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : recentQuotations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay cotizaciones aún</p>
              <Link
                to="/quotations/new"
                className="btn-primary inline-flex items-center gap-2 mt-4"
              >
                <Plus className="w-4 h-4" />
                Crear primera cotización
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Cliente
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Sistema
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Monto
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Estado
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentQuotations.map((quotation: any) => (
                    <tr
                      key={quotation.id}
                      onClick={() => navigate(`/quotations/${quotation.id}`)}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {quotation.client?.name || 'Sin cliente'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {quotation.systemSize} kW
                      </td>
                      <td className="py-3 px-4 text-gray-700 font-medium">
                        {formatCurrency(quotation.salePrice)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${statusColors[quotation.status]}`}>
                          {statusLabels[quotation.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {formatDate(quotation.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="space-y-3">
              <Link
                to="/quotations/new"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <span className="font-medium text-gray-700">Nueva Cotización</span>
              </Link>
              <Link
                to="/clients/new"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-secondary-600" />
                </div>
                <span className="font-medium text-gray-700">Nuevo Cliente</span>
              </Link>
              <Link
                to="/proformas"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-orange-600" />
                </div>
                <span className="font-medium text-gray-700">Ver Proformas</span>
              </Link>
              <Link
                to="/projects"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Folder className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-700">Ver Proyectos</span>
              </Link>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Pendientes</h3>
            <div className="space-y-3">
              {pendingDrafts > 0 && (
                <Link 
                  to="/quotations?status=DRAFT"
                  className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <Send className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {pendingDrafts} cotización{pendingDrafts !== 1 ? 'es' : ''} por enviar
                    </p>
                    <p className="text-xs text-gray-500">En estado borrador</p>
                  </div>
                </Link>
              )}
              
              {pendingViewed > 0 && (
                <Link 
                  to="/quotations?status=VIEWED"
                  className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Eye className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {pendingViewed} cotización{pendingViewed !== 1 ? 'es' : ''} vista{pendingViewed !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-500">Esperando respuesta del cliente</p>
                  </div>
                </Link>
              )}
              
              {pendingProformas > 0 && (
                <Link 
                  to="/proformas?status=DRAFT"
                  className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <Receipt className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {pendingProformas} proforma{pendingProformas !== 1 ? 's' : ''} por enviar
                    </p>
                    <p className="text-xs text-gray-500">Pendientes de firma</p>
                  </div>
                </Link>
              )}
              
              {pendingDrafts === 0 && pendingViewed === 0 && pendingProformas === 0 && (
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      ¡Todo al día!
                    </p>
                    <p className="text-xs text-gray-500">No hay tareas pendientes</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resumen de conversión */}
          <div className="card bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6" />
              <h3 className="font-semibold">Tasa de Conversión</h3>
            </div>
            <div className="text-4xl font-bold mb-2">
              {quotationStats?.conversionRate || 0}%
            </div>
            <p className="text-white/80 text-sm">
              {quotationStats?.byStatus?.approved || 0} de {quotationStats?.total || 0} cotizaciones aprobadas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
