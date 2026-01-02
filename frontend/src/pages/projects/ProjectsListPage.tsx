// =====================================================
// LISTA DE PROYECTOS
// =====================================================

import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Folder, 
  Plus, 
  Search, 
  Clock,
  Wrench,
  Zap,
  CheckCircle,
  XCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useProjects, type Project } from '@/hooks/useProjects';
import { SortableHeader, useSort, sortData, type SortOrder } from '@/components/ui/SortableHeader';

// Status badge component
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

// Progress bar
const ProgressBar = ({ paid, total }: { paid: number; total: number }) => {
  const percent = total > 0 ? Math.round((paid / total) * 100) : 0;
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{formatCurrency(paid)}</span>
        <span className="text-gray-700 font-medium">{percent}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default function ProjectsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { sortField, sortOrder, handleSort } = useSort('createdAt', 'desc');
  
  const { data, isLoading, error } = useProjects({
    page,
    limit: 10,
    search: search || undefined,
    status: statusFilter || undefined,
  });
  
  const projectsRaw = data?.data || [];
  const pagination = data?.pagination;
  
  // Ordenar datos localmente
  const projects = useMemo((): Project[] => {
    return sortData(projectsRaw, sortField, sortOrder, (item: any, field: string) => {
      if (field === 'client.name') return item.client?.name;
      return item[field];
    }) as Project[];
  }, [projectsRaw, sortField, sortOrder]);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proyectos</h1>
          <p className="text-gray-500 mt-1">Gestiona tus proyectos de instalación solar</p>
        </div>
        <Link
          to="/proformas?status=SIGNED"
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Proyecto
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
              <option value="PENDING_PAYMENT">Pendiente Pago</option>
              <option value="IN_PROGRESS">En Instalación</option>
              <option value="CFE_PROCESS">Trámite CFE</option>
              <option value="COMPLETED">Completado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Cargando proyectos...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            Error al cargar proyectos
          </div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center">
            <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay proyectos</h3>
            <p className="text-gray-500 mb-4">
              Los proyectos se crean al firmar proformas
            </p>
            <Link
              to="/proformas"
              className="inline-flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            >
              Ver proformas
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <SortableHeader
                      label="Proyecto"
                      field="projectNumber"
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
                      label="Pagos"
                      field="paidAmount"
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
                  {projects.map((project: Project) => (
                    <tr 
                      key={project.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Folder className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {project.projectNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {project.quotation.quoteNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {project.client.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {project.client.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {project.systemSize} kW
                        </div>
                        <div className="text-xs text-gray-500">
                          {project.panelsQty} paneles
                        </div>
                      </td>
                      <td className="px-6 py-4" style={{ minWidth: 150 }}>
                        <ProgressBar 
                          paid={project.paidAmount} 
                          total={project.totalAmount} 
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(project.createdAt)}
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
