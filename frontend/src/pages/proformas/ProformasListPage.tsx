// =====================================================
// LISTA DE PROFORMAS
// =====================================================

import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Search, 
  Send, 
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useProformas, type Proforma } from '@/hooks/useProformas';
import { SortableHeader, useSort, sortData, type SortOrder } from '@/components/ui/SortableHeader';

// Status badge component
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
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

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
    month: 'short',
    year: 'numeric',
  });
};

export default function ProformasListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { sortField, sortOrder, handleSort } = useSort('createdAt', 'desc');
  
  const { data, isLoading, error } = useProformas({
    page,
    limit: 10,
    search: search || undefined,
    status: statusFilter || undefined,
  });
  
  const proformasRaw = data?.data || [];
  const pagination = data?.pagination;
  
  // Ordenar datos localmente
  const proformas = useMemo((): Proforma[] => {
    return sortData(proformasRaw, sortField, sortOrder, (item: any, field: string) => {
      if (field === 'client.name') return item.client?.name;
      if (field === 'quotation.systemSize') return item.quotation?.systemSize;
      return item[field];
    }) as Proforma[];
  }, [proformasRaw, sortField, sortOrder]);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proformas</h1>
          <p className="text-gray-500 mt-1">Gestiona las prefacturas de tus cotizaciones aprobadas</p>
        </div>
        <Link
          to="/quotations?status=APPROVED"
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Proforma
        </Link>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número, cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          {/* Status filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="DRAFT">Borrador</option>
              <option value="SENT">Enviada</option>
              <option value="PENDING_SIGNATURE">Pendiente Firma</option>
              <option value="SIGNED">Firmada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Cargando proformas...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            Error al cargar proformas
          </div>
        ) : proformas.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay proformas</h3>
            <p className="text-gray-500 mb-4">
              Las proformas se crean al aprobar cotizaciones
            </p>
            <Link
              to="/quotations"
              className="inline-flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            >
              Ver cotizaciones
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <SortableHeader
                      label="Proforma"
                      field="proformaNumber"
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
                      field="quotation.systemSize"
                      currentSort={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Total"
                      field="total"
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {proformas.map((proforma: Proforma) => (
                    <tr 
                      key={proforma.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/proformas/${proforma.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <FileText className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {proforma.proformaNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {proforma.quotation.quoteNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {proforma.client.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {proforma.client.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {proforma.quotation.systemSize} kW
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(proforma.total)}
                        </div>
                        <div className="text-xs text-gray-500">
                          IVA incluido
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={proforma.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(proforma.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Mostrando {(page - 1) * 10 + 1} - {Math.min(page * 10, pagination.total)} de {pagination.total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
