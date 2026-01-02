// =====================================================
// PÁGINA DE CATÁLOGO DE PRODUCTOS
// =====================================================

import { useState, useMemo } from 'react';
import { 
  MapPin, 
  Plus, 
  Pencil, 
  Trash2,
  Loader2,
  Search,
  Sun,
  Battery
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  usePanels,
  useInverters,
  useCitiesHSP,
  useCreatePanel,
  useUpdatePanel,
  useDeletePanel,
  useCreateInverter,
  useUpdateInverter,
  useDeleteInverter,
  useCreateCityHSP,
  useUpdateCityHSP,
  useDeleteCityHSP,
  Panel,
  Inverter,
  CityHSP,
} from '@/hooks/useCatalog';
import { SortableHeader, useSort, sortData, type SortOrder } from '@/components/ui/SortableHeader';

type TabType = 'panels' | 'inverters' | 'cities';

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<TabType>('panels');
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showPanelModal, setShowPanelModal] = useState(false);
  const [showInverterModal, setShowInverterModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [editingPanel, setEditingPanel] = useState<Panel | null>(null);
  const [editingInverter, setEditingInverter] = useState<Inverter | null>(null);
  const [editingCity, setEditingCity] = useState<CityHSP | null>(null);

  const tabs = [
    { id: 'panels' as TabType, label: 'Paneles', icon: Sun },
    { id: 'inverters' as TabType, label: 'Inversores', icon: Battery },
    { id: 'cities' as TabType, label: 'Ciudades HSP', icon: MapPin },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de Productos</h1>
          <p className="text-gray-500 mt-1">Administra paneles, inversores y configuración de ciudades</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'panels' && (
        <PanelsTab
          showInactive={showInactive}
          setShowInactive={setShowInactive}
          search={search}
          setSearch={setSearch}
          onEdit={(panel) => { setEditingPanel(panel); setShowPanelModal(true); }}
          onAdd={() => { setEditingPanel(null); setShowPanelModal(true); }}
        />
      )}
      
      {activeTab === 'inverters' && (
        <InvertersTab
          showInactive={showInactive}
          setShowInactive={setShowInactive}
          search={search}
          setSearch={setSearch}
          onEdit={(inverter) => { setEditingInverter(inverter); setShowInverterModal(true); }}
          onAdd={() => { setEditingInverter(null); setShowInverterModal(true); }}
        />
      )}
      
      {activeTab === 'cities' && (
        <CitiesTab
          search={search}
          setSearch={setSearch}
          onEdit={(city) => { setEditingCity(city); setShowCityModal(true); }}
          onAdd={() => { setEditingCity(null); setShowCityModal(true); }}
        />
      )}

      {/* Modals */}
      {showPanelModal && (
        <PanelModal
          panel={editingPanel}
          onClose={() => { setShowPanelModal(false); setEditingPanel(null); }}
        />
      )}
      
      {showInverterModal && (
        <InverterModal
          inverter={editingInverter}
          onClose={() => { setShowInverterModal(false); setEditingInverter(null); }}
        />
      )}
      
      {showCityModal && (
        <CityModal
          city={editingCity}
          onClose={() => { setShowCityModal(false); setEditingCity(null); }}
        />
      )}
    </div>
  );
}

// =====================================================
// PANELS TAB
// =====================================================

interface PanelsTabProps {
  showInactive: boolean;
  setShowInactive: (v: boolean) => void;
  search: string;
  setSearch: (v: string) => void;
  onEdit: (panel: Panel) => void;
  onAdd: () => void;
}

function PanelsTab({ showInactive, setShowInactive, search, setSearch, onEdit, onAdd }: PanelsTabProps) {
  const { data: panels, isLoading } = usePanels(showInactive);
  const deletePanel = useDeletePanel();
  const { sortField, sortOrder, handleSort } = useSort('brand', 'asc');

  const filteredPanels = useMemo(() => {
    const filtered = panels?.filter(p => 
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.model.toLowerCase().includes(search.toLowerCase())
    ) || [];
    return sortData(filtered, sortField, sortOrder);
  }, [panels, search, sortField, sortOrder]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar paneles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300"
            />
            Mostrar inactivos
          </label>
          <button onClick={onAdd} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Agregar Panel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader label="Marca / Modelo" field="brand" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <SortableHeader label="Potencia" field="power" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <SortableHeader label="Eficiencia" field="efficiency" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <SortableHeader label="Garantía" field="warranty" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <SortableHeader label="Precio" field="price" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <SortableHeader label="Estado" field="isActive" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPanels.map((panel) => (
              <tr key={panel.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Sun className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{panel.brand}</div>
                      <div className="text-sm text-gray-500">{panel.model}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-900">{panel.power}W</td>
                <td className="px-6 py-4 text-gray-900">{panel.efficiency}%</td>
                <td className="px-6 py-4 text-gray-900">{panel.warranty} años</td>
                <td className="px-6 py-4 text-gray-900 font-medium">{formatCurrency(panel.price)}</td>
                <td className="px-6 py-4">
                  <span className={`badge ${panel.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {panel.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(panel)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePanel.mutate({ id: panel.id })}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredPanels.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay paneles registrados
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// INVERTERS TAB
// =====================================================

interface InvertersTabProps {
  showInactive: boolean;
  setShowInactive: (v: boolean) => void;
  search: string;
  setSearch: (v: string) => void;
  onEdit: (inverter: Inverter) => void;
  onAdd: () => void;
}

function InvertersTab({ showInactive, setShowInactive, search, setSearch, onEdit, onAdd }: InvertersTabProps) {
  const { data: inverters, isLoading } = useInverters(showInactive);
  const deleteInverter = useDeleteInverter();
  const { sortField, sortOrder, handleSort } = useSort('brand', 'asc');

  const filteredInverters = useMemo(() => {
    const filtered = inverters?.filter(i => 
      i.brand.toLowerCase().includes(search.toLowerCase()) ||
      i.model.toLowerCase().includes(search.toLowerCase())
    ) || [];
    return sortData(filtered, sortField, sortOrder);
  }, [inverters, search, sortField, sortOrder]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar inversores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300"
            />
            Mostrar inactivos
          </label>
          <button onClick={onAdd} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Agregar Inversor
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader label="Marca / Modelo" field="brand" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <SortableHeader label="Potencia" field="power" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <SortableHeader label="Fases" field="phases" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <SortableHeader label="Garantía" field="warranty" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <SortableHeader label="Precio" field="price" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <SortableHeader label="Estado" field="isActive" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredInverters.map((inverter) => (
              <tr key={inverter.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Battery className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{inverter.brand}</div>
                      <div className="text-sm text-gray-500">{inverter.model}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-900">{inverter.power} kW</td>
                <td className="px-6 py-4 text-gray-900">{inverter.phases}F</td>
                <td className="px-6 py-4 text-gray-900">{inverter.warranty} años</td>
                <td className="px-6 py-4 text-gray-900 font-medium">{formatCurrency(inverter.price)}</td>
                <td className="px-6 py-4">
                  <span className={`badge ${inverter.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {inverter.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(inverter)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteInverter.mutate({ id: inverter.id })}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredInverters.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay inversores registrados
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// CITIES TAB
// =====================================================

interface CitiesTabProps {
  search: string;
  setSearch: (v: string) => void;
  onEdit: (city: CityHSP) => void;
  onAdd: () => void;
}

function CitiesTab({ search, setSearch, onEdit, onAdd }: CitiesTabProps) {
  const { data: cities, isLoading } = useCitiesHSP();
  const deleteCity = useDeleteCityHSP();
  const { sortField, sortOrder, handleSort } = useSort('city', 'asc');

  const filteredCities = useMemo(() => {
    const filtered = cities?.filter(c => 
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.state.toLowerCase().includes(search.toLowerCase())
    ) || [];
    return sortData(filtered, sortField, sortOrder);
  }, [cities, search, sortField, sortOrder]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar ciudades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <button onClick={onAdd} className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Agregar Ciudad
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader label="Ciudad" field="city" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <SortableHeader label="Estado" field="state" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <SortableHeader label="HSP" field="hsp" currentSort={sortField} currentOrder={sortOrder} onSort={handleSort} />
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coordenadas</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCities.map((city) => (
              <tr key={city.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="font-medium text-gray-900">{city.city}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{city.state}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg font-medium">
                    <Sun className="w-4 h-4" />
                    {city.hsp} h/día
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {city.latitude && city.longitude 
                    ? `${city.latitude.toFixed(4)}, ${city.longitude.toFixed(4)}`
                    : '-'
                  }
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(city)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCity.mutate(city.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredCities.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No hay ciudades registradas
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// MODALS
// =====================================================

interface PanelModalProps {
  panel: Panel | null;
  onClose: () => void;
}

function PanelModal({ panel, onClose }: PanelModalProps) {
  const createPanel = useCreatePanel();
  const updatePanel = useUpdatePanel();
  
  const [formData, setFormData] = useState({
    brand: panel?.brand || '',
    model: panel?.model || '',
    power: panel?.power || 550,
    efficiency: panel?.efficiency || 21,
    warranty: panel?.warranty || 25,
    price: panel?.price || 3500,
    isActive: panel?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (panel) {
      await updatePanel.mutateAsync({ id: panel.id, ...formData });
    } else {
      await createPanel.mutateAsync(formData);
    }
    onClose();
  };

  const isLoading = createPanel.isPending || updatePanel.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {panel ? 'Editar Panel' : 'Nuevo Panel'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="input w-full"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Potencia (W)</label>
              <input
                type="number"
                value={formData.power}
                onChange={(e) => setFormData({ ...formData, power: Number(e.target.value) })}
                className="input w-full"
                min="100"
                max="1000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eficiencia (%)</label>
              <input
                type="number"
                value={formData.efficiency}
                onChange={(e) => setFormData({ ...formData, efficiency: Number(e.target.value) })}
                className="input w-full"
                min="10"
                max="30"
                step="0.1"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Garantía (años)</label>
              <input
                type="number"
                value={formData.warranty}
                onChange={(e) => setFormData({ ...formData, warranty: Number(e.target.value) })}
                className="input w-full"
                min="1"
                max="50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio (MXN)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="input w-full"
                min="0"
                required
              />
            </div>
          </div>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">Activo</span>
          </label>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (panel ? 'Guardar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface InverterModalProps {
  inverter: Inverter | null;
  onClose: () => void;
}

function InverterModal({ inverter, onClose }: InverterModalProps) {
  const createInverter = useCreateInverter();
  const updateInverter = useUpdateInverter();
  
  const [formData, setFormData] = useState({
    brand: inverter?.brand || '',
    model: inverter?.model || '',
    power: inverter?.power || 5,
    phases: inverter?.phases || 1,
    warranty: inverter?.warranty || 10,
    price: inverter?.price || 15000,
    isActive: inverter?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inverter) {
      await updateInverter.mutateAsync({ id: inverter.id, ...formData });
    } else {
      await createInverter.mutateAsync(formData);
    }
    onClose();
  };

  const isLoading = createInverter.isPending || updateInverter.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {inverter ? 'Editar Inversor' : 'Nuevo Inversor'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="input w-full"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Potencia (kW)</label>
              <input
                type="number"
                value={formData.power}
                onChange={(e) => setFormData({ ...formData, power: Number(e.target.value) })}
                className="input w-full"
                min="0.5"
                max="100"
                step="0.5"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fases</label>
              <select
                value={formData.phases}
                onChange={(e) => setFormData({ ...formData, phases: Number(e.target.value) })}
                className="input w-full"
              >
                <option value={1}>Monofásico (1F)</option>
                <option value={3}>Trifásico (3F)</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Garantía (años)</label>
              <input
                type="number"
                value={formData.warranty}
                onChange={(e) => setFormData({ ...formData, warranty: Number(e.target.value) })}
                className="input w-full"
                min="1"
                max="30"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio (MXN)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="input w-full"
                min="0"
                required
              />
            </div>
          </div>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">Activo</span>
          </label>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (inverter ? 'Guardar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CityModalProps {
  city: CityHSP | null;
  onClose: () => void;
}

function CityModal({ city, onClose }: CityModalProps) {
  const createCity = useCreateCityHSP();
  const updateCity = useUpdateCityHSP();
  
  const [formData, setFormData] = useState({
    city: city?.city || '',
    state: city?.state || '',
    hsp: city?.hsp || 5.5,
    latitude: city?.latitude || undefined,
    longitude: city?.longitude || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (city) {
      await updateCity.mutateAsync({ id: city.id, ...formData });
    } else {
      await createCity.mutateAsync(formData);
    }
    onClose();
  };

  const isLoading = createCity.isPending || updateCity.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {city ? 'Editar Ciudad' : 'Nueva Ciudad'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="input w-full"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="input w-full"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HSP (Horas Sol Pico)</label>
            <input
              type="number"
              value={formData.hsp}
              onChange={(e) => setFormData({ ...formData, hsp: Number(e.target.value) })}
              className="input w-full"
              min="1"
              max="10"
              step="0.1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Promedio de horas de sol pico por día</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitud (opcional)</label>
              <input
                type="number"
                value={formData.latitude || ''}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? Number(e.target.value) : undefined })}
                className="input w-full"
                step="0.0001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitud (opcional)</label>
              <input
                type="number"
                value={formData.longitude || ''}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? Number(e.target.value) : undefined })}
                className="input w-full"
                step="0.0001"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (city ? 'Guardar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
