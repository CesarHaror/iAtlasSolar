// =====================================================
// PÁGINA DE LISTA DE CLIENTES
// =====================================================

import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Users,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useClients, useDeleteClient, Client } from '@/hooks/useClients';
import { cn } from '@/lib/utils';
import { SortableHeader, useSort, sortData, type SortOrder } from '@/components/ui/SortableHeader';

export default function ClientsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { sortField, sortOrder, handleSort } = useSort('createdAt', 'desc');

  const { data, isLoading, error } = useClients({
    search: search || undefined,
    page,
    limit: 10,
  });

  const deleteClient = useDeleteClient();
  
  // Ordenar datos localmente
  const clients = useMemo(() => {
    const rawClients = data?.clients || [];
    return sortData(rawClients, sortField, sortOrder);
  }, [data?.clients, sortField, sortOrder]);

  const handleDelete = (client: Client) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${client.name}?`)) {
      deleteClient.mutate(client.id);
    }
    setOpenMenuId(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tu cartera de clientes
          </p>
        </div>
        <Link to="/clients/new" className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </Link>
      </div>

      {/* Barra de búsqueda */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <button type="submit" className="btn-primary">
            Buscar
          </button>
        </form>
      </div>

      {/* Lista de clientes */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            Error al cargar clientes
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay clientes
            </h3>
            <p className="text-gray-500 mb-4">
              {search ? 'No se encontraron resultados' : 'Comienza agregando tu primer cliente'}
            </p>
            {!search && (
              <Link to="/clients/new" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Agregar Cliente
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Tabla de clientes */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <SortableHeader
                      label="Cliente"
                      field="name"
                      currentSort={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Contacto
                    </th>
                    <SortableHeader
                      label="Ubicación"
                      field="city"
                      currentSort={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Tarifa"
                      field="cfeTariff"
                      currentSort={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                      Cotizaciones
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-700 font-semibold">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{client.name}</p>
                            {client.rfc && (
                              <p className="text-sm text-gray-500">RFC: {client.rfc}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            {client.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {client.phone}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {client.city}
                          {client.state && `, ${client.state}`}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {client.cfeTariff ? (
                          <span className={cn(
                            'badge',
                            client.cfeTariff === 'DAC' ? 'badge-warning' : 
                            client.cfeTariff === 'GDMTH' || client.cfeTariff === 'GDMTO' ? 'badge-success' : 
                            'badge-info'
                          )}>
                            {client.cfeTariff}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {client._count?.quotations || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === client.id ? null : client.id);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-500" />
                          </button>

                          {openMenuId === client.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/clients/${client.id}`);
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                              >
                                <Eye className="w-4 h-4" />
                                Ver Detalle
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/clients/${client.id}/edit`);
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                              >
                                <Edit className="w-4 h-4" />
                                Editar
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/quotations/new?clientId=${client.id}`);
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                              >
                                <FileText className="w-4 h-4" />
                                Nueva Cotización
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(client);
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                              >
                                <Trash2 className="w-4 h-4" />
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Mostrando {((page - 1) * 10) + 1} a {Math.min(page * 10, data.pagination.total)} de {data.pagination.total} clientes
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Página {page} de {data.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= data.pagination.totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
