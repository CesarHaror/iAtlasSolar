// =====================================================
// LISTA DE COTIZACIONES
// =====================================================

import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  Send,
  FileText,
  Calculator,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useQuotations, useQuotationStats, useDeleteQuotation, useDuplicateQuotation } from '@/hooks/useQuotations';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { SortableHeader, useSort, sortData, type SortOrder } from '@/components/ui/SortableHeader';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: 'Borrador', color: 'bg-gray-100 text-gray-700', icon: FileText },
  SENT: { label: 'Enviada', color: 'bg-blue-100 text-blue-700', icon: Send },
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  APPROVED: { label: 'Aprobada', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  REJECTED: { label: 'Rechazada', color: 'bg-red-100 text-red-700', icon: XCircle },
  EXPIRED: { label: 'Expirada', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
};

export default function QuotationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const { sortField, sortOrder, handleSort } = useSort('createdAt', 'desc');
  
  const { data, isLoading } = useQuotations({
    page,
    limit: 15,
    search: search || undefined,
    status: statusFilter || undefined,
  });
  
  const { data: stats } = useQuotationStats();
  const deleteQuotation = useDeleteQuotation();
  const duplicateQuotation = useDuplicateQuotation();
  
  const quotationsRaw = data?.data || [];
  const pagination = data?.pagination;
  
  // Ordenar datos localmente
  const quotations = useMemo(() => {
    return sortData(quotationsRaw, sortField, sortOrder, (item: any, field: string) => {
      if (field === 'client.name') return item.client?.name;
      return item[field];
    });
  }, [quotationsRaw, sortField, sortOrder]);
  
  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta cotización?')) {
      await deleteQuotation.mutateAsync(id);
      setOpenMenuId(null);
    }
  };
  
  const handleDuplicate = async (id: string) => {
    const duplicate = await duplicateQuotation.mutateAsync(id);
    setOpenMenuId(null);
    navigate(`/quotations/${duplicate.id}`);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-gray-600 mt-1">
            Gestiona y da seguimiento a tus propuestas solares
          </p>
        </div>
        <Link to="/quotations/new" className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nueva Cotización
        </Link>
      </div>
      
      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card py-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="card py-4">
            <p className="text-sm text-gray-600">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">
              {(stats.byStatus.draft || 0) + (stats.byStatus.sent || 0) + (stats.byStatus.viewed || 0)}
            </p>
          </div>
          <div className="card py-4">
            <p className="text-sm text-gray-600">Aprobadas</p>
            <p className="text-2xl font-bold text-green-600">{stats.byStatus.approved}</p>
          </div>
          <div className="card py-4">
            <p className="text-sm text-gray-600">Conversión</p>
            <p className="text-2xl font-bold text-primary-600">{stats.conversionRate}%</p>
          </div>
          <div className="card py-4">
            <p className="text-sm text-gray-600">Monto Aprobado</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(stats.approvedAmount)}</p>
          </div>
        </div>
      )}
      
      {/* Filtros */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número, cliente..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="form-input pl-10"
            />
          </div>
          
          {/* Filtro por estado */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="form-input pl-10 pr-10 min-w-[180px]"
            >
              <option value="">Todos los estados</option>
              <option value="DRAFT">Borrador</option>
              <option value="SENT">Enviada</option>
              <option value="PENDING">Pendiente</option>
              <option value="APPROVED">Aprobada</option>
              <option value="REJECTED">Rechazada</option>
              <option value="EXPIRED">Expirada</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Tabla de cotizaciones */}
      <div className="card p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : quotations.length === 0 ? (
          <div className="text-center py-12">
            <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search || statusFilter ? 'Sin resultados' : 'Sin cotizaciones'}
            </h3>
            <p className="text-gray-600 mb-4">
              {search || statusFilter
                ? 'No se encontraron cotizaciones con los filtros aplicados'
                : 'Crea tu primera cotización solar'}
            </p>
            {!search && !statusFilter && (
              <Link to="/quotations/new" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nueva Cotización
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <SortableHeader
                      label="Cotización"
                      field="quoteNumber"
                      currentSort={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Cliente"
                      field="client.name"
                      currentSort={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Sistema"
                      field="systemSize"
                      currentSort={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Precio"
                      field="salePrice"
                      currentSort={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Estado"
                      field="status"
                      currentSort={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Fecha"
                      field="createdAt"
                      currentSort={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quotations.map((quotation: any) => {
                    const statusConfig = STATUS_CONFIG[quotation.status] || STATUS_CONFIG.DRAFT;
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <tr key={quotation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <Link
                            to={`/quotations/${quotation.id}`}
                            className="font-medium text-primary-600 hover:text-primary-700"
                          >
                            {quotation.quoteNumber}
                          </Link>
                          {quotation.version > 1 && (
                            <span className="ml-2 text-xs text-gray-500">v{quotation.version}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{quotation.client?.name}</p>
                            <p className="text-sm text-gray-500">{quotation.client?.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{quotation.systemSize} kWp</p>
                            <p className="text-sm text-gray-500">{quotation.panelsQty} paneles</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{formatCurrency(quotation.salePrice)}</p>
                          <p className="text-sm text-gray-500">
                            Ahorro: {formatCurrency(quotation.monthlySavings)}/mes
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                            statusConfig.color
                          )}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(quotation.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuPosition({
                                top: rect.top - 10,
                                left: rect.left - 160,
                              });
                              setOpenMenuId(openMenuId === quotation.id ? null : quotation.id);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-400" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Paginación */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-gray-600">
                  Mostrando {((page - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(page * pagination.limit, pagination.total)} de {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600">
                    {page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Menú de acciones flotante */}
      {openMenuId && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setOpenMenuId(null)}
          />
          <div 
            className="fixed w-48 bg-white rounded-lg shadow-xl border z-[9999]"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <div className="py-1">
              <Link
                to={`/quotations/${openMenuId}`}
                onClick={() => setOpenMenuId(null)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Eye className="w-4 h-4" />
                Ver detalle
              </Link>
              <Link
                to={`/quotations/${openMenuId}/edit`}
                onClick={() => setOpenMenuId(null)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Edit className="w-4 h-4" />
                Editar
              </Link>
              <button
                onClick={() => handleDuplicate(openMenuId)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
              >
                <Copy className="w-4 h-4" />
                Duplicar
              </button>
              <hr className="my-1" />
              <button
                onClick={() => handleDelete(openMenuId)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
