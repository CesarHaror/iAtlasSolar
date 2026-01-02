import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileUp,
  User,
  Settings,
  CheckCircle,
  Calculator,
  Zap,
  Sun,
  DollarSign,
  Leaf,
  Clock,
  Building,
  Home,
  Warehouse,
  Search,
  Plus,
  Edit3,
  AlertCircle,
  TrendingUp,
  Battery,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useCalculateSolar, useCreateQuotation, CreateQuotationInput } from '../../hooks/useQuotations';
import { useClients, useSearchClients } from '../../hooks/useClients';
import { usePanels, useInverters } from '../../hooks/useCatalog';
import { CFEReceiptData } from '../../hooks/useOCR';
import CFEReceiptUpload from '../../components/quotations/CFEReceiptUpload';
import CreateClientFromReceiptModal from '../../components/clients/CreateClientFromReceiptModal';

// Tipos
type Step = 'receipt' | 'client' | 'config' | 'results';
type Tariff = 'DAC' | 'T01' | 'T1' | 'T1A' | 'T1B' | 'T1C' | 'T1D' | 'T1E' | 'T1F' | 'PDBT' | 'GDMTH' | 'GDMTO';
type InstallationType = 'ground' | 'roof_concrete' | 'roof_metal';

interface ClientData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string | null;
  cfeServiceNumber?: string;
  cfeTariff?: string;
}

// Constantes
const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'receipt', label: 'Recibo CFE', icon: FileUp },
  { key: 'client', label: 'Cliente y Consumo', icon: User },
  { key: 'config', label: 'Configuración', icon: Settings },
  { key: 'results', label: 'Resultados', icon: CheckCircle },
];

const TARIFF_OPTIONS: { value: Tariff; label: string; description: string }[] = [
  { value: 'DAC', label: 'DAC', description: 'Doméstico Alto Consumo' },
  { value: 'T01', label: '01', description: 'Doméstica (Tarifa 01)' },
  { value: 'T1', label: '1', description: 'Doméstico básico' },
  { value: 'T1A', label: '1A', description: 'Doméstico clima cálido' },
  { value: 'T1B', label: '1B', description: 'Doméstico clima cálido extremo' },
  { value: 'T1C', label: '1C', description: 'Doméstico clima muy cálido' },
  { value: 'T1D', label: '1D', description: 'Doméstico clima cálido' },
  { value: 'T1E', label: '1E', description: 'Doméstico clima extremo' },
  { value: 'T1F', label: '1F', description: 'Doméstico clima muy extremo' },
  { value: 'PDBT', label: 'PDBT', description: 'Pequeña Demanda Baja Tensión' },
  { value: 'GDMTH', label: 'GDMTH', description: 'Gran Demanda Media Tensión Horaria' },
  { value: 'GDMTO', label: 'GDMTO', description: 'Gran Demanda Media Tensión Ordinaria' },
];

const INSTALLATION_TYPES: { value: InstallationType; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'roof_concrete', label: 'Techo de Concreto', icon: Building, description: 'Losa o techo plano' },
  { value: 'roof_metal', label: 'Techo Metálico', icon: Warehouse, description: 'Nave industrial o comercial' },
  { value: 'ground', label: 'Piso', icon: Home, description: 'Instalación en terreno' },
];

export default function NewQuotationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdFromParams = searchParams.get('clientId');

  // Hooks
  const calculateSolar = useCalculateSolar();
  const createQuotation = useCreateQuotation();
  const { data: clientsData } = useClients();
  const clients = clientsData?.clients || [];
  const { data: panels = [] } = usePanels();
  const { data: inverters = [] } = useInverters();

  // Estado del wizard
  const [currentStep, setCurrentStep] = useState<Step>('receipt');
  const [isManualMode, setIsManualMode] = useState(false);

  // Datos del recibo
  const [receiptData, setReceiptData] = useState<CFEReceiptData | null>(null);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);

  // Datos del cliente
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const { data: searchResults = [], isLoading: isSearching } = useSearchClients(clientSearch, clientSearch.length >= 2);

  // Datos de consumo (editables)
  const [tariff, setTariff] = useState<Tariff>('DAC');
  const [monthlyConsumption, setMonthlyConsumption] = useState<number>(0);
  const [avgBill, setAvgBill] = useState<number>(0);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // Configuración del sistema
  const [installationType, setInstallationType] = useState<InstallationType>('roof_concrete');
  const [selectedPanel, setSelectedPanel] = useState<string>('');
  const [selectedInverter, setSelectedInverter] = useState<string>('');
  const [useCustomEquipment, setUseCustomEquipment] = useState(false);

  // Resultados
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Si viene un clientId en la URL, buscarlo y pre-seleccionar
  useEffect(() => {
    if (clientIdFromParams && clients.length > 0) {
      const client = clients.find((c: any) => c.id === clientIdFromParams);
      if (client) {
        setSelectedClient(client as ClientData);
        setCurrentStep('client');
        setIsManualMode(true);
        if (client.cfeTariff) {
          setTariff(client.cfeTariff as Tariff);
        }
        if (client.city) setCity(client.city);
        if (client.state) setState(client.state || '');
      }
    }
  }, [clientIdFromParams, clients]);

  // Manejar datos extraídos del recibo
  const handleReceiptDataExtracted = (data: CFEReceiptData) => {
    setReceiptData(data);
    if (data.tariff) setTariff(data.tariff as Tariff);
    if (data.consumption?.monthly) setMonthlyConsumption(data.consumption.monthly);
    // Usar el promedio histórico de gasto si está disponible, sino usar el monto del periodo actual
    if (data.billing?.averageAmount) {
      setAvgBill(data.billing.averageAmount);
    } else if (data.billing?.totalAmount) {
      setAvgBill(data.billing.totalAmount);
    }
    if (data.city) setCity(data.city);
    if (data.state) setState(data.state);
  };

  // Cuando se crea un cliente desde el recibo
  const handleClientCreated = (clientId: string) => {
    // Buscar el cliente creado en la lista
    const client = clients.find((c: any) => c.id === clientId);
    if (client) {
      setSelectedClient(client as ClientData);
    }
    setShowCreateClientModal(false);
    // Continuar al siguiente paso
    setCurrentStep('client');
  };

  // Seleccionar cliente existente
  const handleSelectClient = (client: ClientData) => {
    setSelectedClient(client);
    setClientSearch('');
    if (client.cfeTariff && !receiptData?.tariff) {
      setTariff(client.cfeTariff as Tariff);
    }
    if (client.city && !receiptData?.city) setCity(client.city);
    if (client.state && !receiptData?.state) setState(client.state || '');
  };

  // Calcular el sistema
  const handleCalculate = async () => {
    if (!selectedClient) {
      setError('Debes seleccionar un cliente');
      return;
    }
    if (monthlyConsumption <= 0) {
      setError('El consumo mensual debe ser mayor a 0');
      return;
    }

    setError(null);

    try {
      const panel = panels.find((p: any) => p.id === selectedPanel);
      const inverter = inverters.find((i: any) => i.id === selectedInverter);

      const installationTypeMap: Record<InstallationType, 'ROOF' | 'GROUND' | 'CARPORT'> = {
        'roof_concrete': 'ROOF',
        'roof_metal': 'ROOF',
        'ground': 'GROUND',
      };

      const calculationData = {
        monthlyKwh: monthlyConsumption,
        bimonthlyBill: avgBill || undefined,
        cfeTariff: tariff,
        city: city || 'Guadalajara',
        state: state || undefined,
        installationType: installationTypeMap[installationType],
        panelId: useCustomEquipment && panel ? panel.id : undefined,
        inverterId: useCustomEquipment && inverter ? inverter.id : undefined,
      };

      const result = await calculateSolar.mutateAsync(calculationData);
      
      // Mapear los campos del backend a los esperados por el frontend
      const mappedResults = {
        // Dimensionamiento
        systemSize: result.systemSizeKwp,
        panelsQty: result.numberOfPanels,
        panelPower: result.panel?.watts,
        monthlyProduction: result.monthlyGenerationKwh,
        annualProduction: result.annualGenerationKwh,
        roofArea: result.roofAreaM2,
        
        // Equipo
        panelBrand: result.panel?.brand,
        panelModel: result.panel?.model,
        panelPrice: result.panel?.price,
        inverterBrand: result.inverter?.brand,
        inverterModel: result.inverter?.model,
        inverterPower: result.inverter?.capacityKw,
        inverterPrice: result.inverter?.price,
        numberOfInverters: result.numberOfInverters,
        
        // Costos
        realCost: result.subtotal,
        salePrice: result.totalPrice,
        pricePerWatt: result.pricePerWatt,
        costBreakdown: {
          panels: result.panelsCost,
          inverter: result.invertersCost,
          structure: result.structureCost,
          installation: result.installationCost,
          electrical: result.electricalMaterialsCost,
          labor: result.laborCost,
          margin: result.margin,
          iva: result.iva,
        },
        
        // Ahorros y ROI
        monthlySavings: result.monthlySavings,
        annualSavings: result.annualSavings,
        savingsPercentage: result.savingsPercentage,
        paybackYears: result.paybackYears,
        roi25Years: result.roi25Years,
        lifetimeSavings: result.lifetimeSavings,
        monthlyBillBefore: result.monthlyBillBefore,
        monthlyBillAfter: result.monthlyBillAfter,
        
        // Datos CFE
        cfeTariff: result.cfeTariff,
        tariffRate: result.tariffRate,
        hsp: result.hsp,
        
        // Ambiental
        co2OffsetTons: result.co2OffsetTons,
        treesEquivalent: result.treesEquivalent,
      };
      
      setResults(mappedResults);
      setCurrentStep('results');
    } catch (err: any) {
      setError(err.message || 'Error al calcular');
    }
  };

  // Guardar cotización
  const handleSaveQuotation = async () => {
    if (!results || !selectedClient) return;

    try {
      // Construir los datos para crear la cotización usando los valores originales
      const installationTypeMap: Record<InstallationType, 'ROOF' | 'GROUND' | 'CARPORT'> = {
        'roof_concrete': 'ROOF',
        'roof_metal': 'ROOF',
        'ground': 'GROUND',
      };
      
      const quotationData: CreateQuotationInput = {
        clientId: selectedClient.id,
        monthlyKwh: monthlyConsumption,
        bimonthlyBill: avgBill || undefined,
        cfeTariff: tariff,
        city: city || 'Guadalajara',
        state: state || undefined,
        installationType: installationTypeMap[installationType],
        panelId: useCustomEquipment && selectedPanel ? selectedPanel : undefined,
        inverterId: useCustomEquipment && selectedInverter ? selectedInverter : undefined,
        notes: '',
      };
      
      const savedQuotation = await createQuotation.mutateAsync(quotationData);
      
      navigate(`/quotations/${savedQuotation.id}`);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la cotización');
    }
  };

  // Verificar si se puede continuar al siguiente paso
  const canContinue = useMemo(() => {
    switch (currentStep) {
      case 'receipt':
        return receiptData !== null || isManualMode;
      case 'client':
        return selectedClient !== null && monthlyConsumption > 0;
      case 'config':
        return true;
      case 'results':
        return results !== null;
      default:
        return false;
    }
  }, [currentStep, receiptData, isManualMode, selectedClient, monthlyConsumption, results]);

  // Navegar al siguiente paso
  const goToNextStep = () => {
    const stepIndex = STEPS.findIndex((s) => s.key === currentStep);
    if (stepIndex < STEPS.length - 1) {
      const nextStep = STEPS[stepIndex + 1].key;
      if (nextStep === 'results') {
        handleCalculate();
      } else {
        setCurrentStep(nextStep);
      }
    }
  };

  // Navegar al paso anterior
  const goToPreviousStep = () => {
    const stepIndex = STEPS.findIndex((s) => s.key === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].key);
    }
  };

  // Ir a un paso específico
  const goToStep = (step: Step) => {
    const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
    const targetIndex = STEPS.findIndex((s) => s.key === step);
    // Solo permitir ir a pasos anteriores o al actual
    if (targetIndex <= currentIndex) {
      setCurrentStep(step);
    }
  };

  // ===== RENDER DE CADA PASO =====

  // Paso 1: Subir recibo CFE
  const renderReceiptStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white mb-4">
          <FileUp className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Sube el Recibo CFE</h2>
        <p className="text-gray-600 mt-2">
          Analiza automáticamente el recibo para extraer consumo, tarifa y datos del cliente
        </p>
      </div>

      <CFEReceiptUpload
        onDataExtracted={handleReceiptDataExtracted}
        onClose={() => {}}
        onClientCreated={handleClientCreated}
      />

      <div className="text-center mt-6">
        <button
          onClick={() => {
            setIsManualMode(true);
            setCurrentStep('client');
          }}
          className="text-gray-500 hover:text-gray-700 underline text-sm"
        >
          ¿No tienes el recibo? Ingresa los datos manualmente
        </button>
      </div>
    </div>
  );

  // Paso 2: Cliente y Consumo
  const renderClientStep = () => (
    <div className="space-y-8">
      {/* Sección de Cliente */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-amber-500" />
          Cliente
        </h3>

        {selectedClient ? (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">{selectedClient.name}</p>
              {selectedClient.email && <p className="text-sm text-gray-500">{selectedClient.email}</p>}
              {selectedClient.city && (
                <p className="text-sm text-gray-500">
                  {selectedClient.city}, {selectedClient.state}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedClient(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Buscar cliente por nombre, email o teléfono..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              
              {/* Resultados de búsqueda */}
              {clientSearch.length >= 2 && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((client: any) => (
                    <button
                      key={client.id}
                      onClick={() => handleSelectClient(client as ClientData)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-500">{client.email || client.phone}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Crear desde recibo o nuevo */}
            <div className="flex flex-wrap gap-3">
              {receiptData?.clientName && (
                <button
                  onClick={() => setShowCreateClientModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100"
                >
                  <Plus className="w-4 h-4" />
                  Crear cliente desde recibo
                </button>
              )}
              <button
                onClick={() => navigate('/clients/new?returnTo=quotation')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
                Crear cliente nuevo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sección de Consumo */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Datos de Consumo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tarifa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarifa CFE
            </label>
            <select
              value={tariff}
              onChange={(e) => setTariff(e.target.value as Tariff)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {TARIFF_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          {/* Consumo mensual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Consumo Mensual (kWh)
            </label>
            <input
              type="number"
              value={monthlyConsumption || ''}
              onChange={(e) => setMonthlyConsumption(Number(e.target.value))}
              placeholder="ej. 500"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Monto promedio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Promedio del Recibo ($)
            </label>
            <input
              type="number"
              value={avgBill || ''}
              onChange={(e) => setAvgBill(Number(e.target.value))}
              placeholder="ej. 1500"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Ciudad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ciudad
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="ej. Guadalajara"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        {receiptData && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Los datos fueron pre-llenados desde el recibo CFE. Puedes editarlos si es necesario.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Paso 3: Configuración
  const renderConfigStep = () => (
    <div className="space-y-8">
      {/* Tipo de instalación */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building className="w-5 h-5 text-amber-500" />
          Tipo de Instalación
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INSTALLATION_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = installationType === type.value;
            return (
              <button
                key={type.value}
                onClick={() => setInstallationType(type.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-8 h-8 mx-auto mb-2 ${isSelected ? 'text-amber-600' : 'text-gray-400'}`} />
                <p className={`font-medium ${isSelected ? 'text-amber-700' : 'text-gray-700'}`}>
                  {type.label}
                </p>
                <p className="text-sm text-gray-500 mt-1">{type.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Equipo personalizado (opcional) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            Equipo Específico
            <span className="text-sm font-normal text-gray-500">(Opcional)</span>
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useCustomEquipment}
              onChange={(e) => setUseCustomEquipment(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-600">Seleccionar manualmente</span>
          </label>
        </div>

        {useCustomEquipment && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Panel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Panel Solar
              </label>
              <select
                value={selectedPanel}
                onChange={(e) => setSelectedPanel(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Selección automática</option>
                {panels.map((panel: any) => (
                  <option key={panel.id} value={panel.id}>
                    {panel.brand} {panel.model} - {panel.power}W
                  </option>
                ))}
              </select>
            </div>

            {/* Inversor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inversor
              </label>
              <select
                value={selectedInverter}
                onChange={(e) => setSelectedInverter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Selección automática</option>
                {inverters.map((inverter: any) => (
                  <option key={inverter.id} value={inverter.id}>
                    {inverter.brand} {inverter.model} - {inverter.power}kW
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {!useCustomEquipment && (
          <p className="text-sm text-gray-500">
            El sistema seleccionará automáticamente el mejor equipo basándose en el consumo y la ubicación.
          </p>
        )}
      </div>

      {/* Resumen antes de calcular */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de la Cotización</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Cliente</p>
            <p className="font-medium">{selectedClient?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Consumo</p>
            <p className="font-medium">{monthlyConsumption.toLocaleString()} kWh/mes</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tarifa</p>
            <p className="font-medium">{tariff}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Instalación</p>
            <p className="font-medium">
              {INSTALLATION_TYPES.find((t) => t.value === installationType)?.label}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Paso 4: Resultados
  const renderResultsStep = () => {
    if (!results) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Calculando sistema solar óptimo...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header con sistema */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Sistema de {results.systemSize?.toFixed(2)} kW</h2>
              <p className="opacity-90">{results.panelsQty} paneles de {results.panelPower}W</p>
            </div>
            <Sun className="w-16 h-16 opacity-80" />
          </div>
        </div>

        {/* Grid de métricas principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-medium">Producción Mensual</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {results.monthlyProduction?.toLocaleString()} <span className="text-sm font-normal">kWh</span>
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm font-medium">Ahorro Mensual</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${results.monthlySavings?.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Retorno Inversión</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {results.paybackYears?.toFixed(1)} <span className="text-sm font-normal">años</span>
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">ROI 25 años</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {results.roi25Years?.toLocaleString()}%
            </p>
          </div>
        </div>

        {/* Equipo */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Battery className="w-5 h-5 text-amber-500" />
            Equipo del Sistema
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Panel Solar</p>
              <p className="font-medium text-gray-900">
                {results.panelBrand} {results.panelModel}
              </p>
              <p className="text-sm text-gray-600">
                {results.panelsQty} unidades × {results.panelPower}W
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Inversor</p>
              <p className="font-medium text-gray-900">
                {results.inverterBrand} {results.inverterModel}
              </p>
              <p className="text-sm text-gray-600">{results.inverterPower}kW</p>
            </div>
          </div>
        </div>

        {/* Costos */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Inversión
          </h3>

          <div className="space-y-3">
            {results.costBreakdown && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paneles solares</span>
                  <span>${results.costBreakdown.panels?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Inversor</span>
                  <span>${results.costBreakdown.inverter?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estructura ({INSTALLATION_TYPES.find((t) => t.value === installationType)?.label})</span>
                  <span>${results.costBreakdown.structure?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Instalación</span>
                  <span>${results.costBreakdown.installation?.toLocaleString()}</span>
                </div>
              </>
            )}
            <div className="border-t pt-3 flex justify-between">
              <span className="text-gray-600">Costo real</span>
              <span className="font-medium">${results.realCost?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Precio de Venta</span>
              <span className="text-green-600">${results.salePrice?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Impacto ambiental */}
        <div className="bg-green-50 rounded-2xl border border-green-200 p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
            <Leaf className="w-5 h-5" />
            Impacto Ambiental (25 años)
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-green-700">CO₂ evitado</p>
              <p className="text-xl font-bold text-green-900">
                {(results.co2OffsetTons * 25).toFixed(1)} toneladas
              </p>
            </div>
            <div>
              <p className="text-sm text-green-700">Equivalente a plantar</p>
              <p className="text-xl font-bold text-green-900">
                {Math.round(results.treesEquivalent * 25)} árboles
              </p>
            </div>
          </div>
        </div>

        {/* Botón de guardar */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleSaveQuotation}
            disabled={createQuotation.isPending}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {createQuotation.isPending ? 'Guardando...' : 'Guardar Cotización'}
          </button>
        </div>
      </div>
    );
  };

  // Render principal
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/quotations')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Nueva Cotización</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCurrent = currentStep === step.key;
              const isPast = STEPS.findIndex((s) => s.key === currentStep) > index;
              const isClickable = isPast;

              return (
                <div key={step.key} className="flex items-center">
                  <button
                    onClick={() => isClickable && goToStep(step.key)}
                    disabled={!isClickable}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-amber-100 text-amber-700'
                        : isPast
                        ? 'text-green-600 hover:bg-green-50 cursor-pointer'
                        : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCurrent
                          ? 'bg-amber-500 text-white'
                          : isPast
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200'
                      }`}
                    >
                      {isPast ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className="hidden md:inline font-medium">{step.label}</span>
                  </button>

                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-8 md:w-16 h-0.5 mx-2 ${
                        isPast ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Render step content */}
        {currentStep === 'receipt' && renderReceiptStep()}
        {currentStep === 'client' && renderClientStep()}
        {currentStep === 'config' && renderConfigStep()}
        {currentStep === 'results' && renderResultsStep()}

        {/* Navigation buttons */}
        {currentStep !== 'results' && (
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={goToPreviousStep}
              disabled={currentStep === 'receipt'}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                currentStep === 'receipt'
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              Anterior
            </button>

            <button
              onClick={goToNextStep}
              disabled={!canContinue || calculateSolar.isPending}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                canContinue && !calculateSolar.isPending
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {calculateSolar.isPending ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Calculando...
                </>
              ) : currentStep === 'config' ? (
                <>
                  <Calculator className="w-5 h-5" />
                  Calcular Sistema
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Modal para crear cliente desde recibo */}
      {showCreateClientModal && receiptData && (
        <CreateClientFromReceiptModal
          isOpen={showCreateClientModal}
          receiptData={receiptData}
          onClose={() => setShowCreateClientModal(false)}
          onClientCreated={handleClientCreated}
        />
      )}
    </div>
  );
}
