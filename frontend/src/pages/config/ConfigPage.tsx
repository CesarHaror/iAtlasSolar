// Estado y función de prueba de email se moverán dentro del componente principal
// =====================================================
// PÁGINA DE CONFIGURACIÓN DEL SISTEMA
// =====================================================

import { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  FileText, 
  Sun, 
  DollarSign, 
  CreditCard,
  Percent,
  Bell,
  Save,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';
import { useConfigsGrouped, useSetConfigs, useInitializeDefaults } from '@/hooks/useConfig';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

// Grupos de configuración
const CONFIG_GROUPS = {
  company: {
    label: 'Empresa',
    icon: Building2,
    color: 'blue',
  },
  quotation: {
    label: 'Cotizaciones',
    icon: FileText,
    color: 'purple',
  },
  solar: {
    label: 'Sistema Solar',
    icon: Sun,
    color: 'yellow',
  },
  costs: {
    label: 'Costos',
    icon: DollarSign,
    color: 'green',
  },
  payments: {
    label: 'Pagos',
    icon: CreditCard,
    color: 'orange',
  },
  tax: {
    label: 'Impuestos',
    icon: Percent,
    color: 'red',
  },
  notifications: {
    label: 'Notificaciones',
    icon: Bell,
    color: 'indigo',
  },
};

// Labels amigables para cada configuración
const CONFIG_LABELS: Record<string, string> = {
  'company.name': 'Nombre de la empresa',
  'company.phone': 'Teléfono',
  'company.email': 'Email',
  'company.address': 'Dirección',
  'company.logo': 'Logo de la empresa',
  'quotation.validityDays': 'Días de validez',
  'quotation.defaultMargin': 'Margen predeterminado (%)',
  'quotation.defaultDiscount': 'Descuento predeterminado (%)',
  'solar.defaultPanelPower': 'Potencia de panel (W)',
  'solar.systemEfficiency': 'Eficiencia del sistema',
  'solar.defaultHSP': 'HSP predeterminado',
  'costs.pricePerWatt': 'Precio por Watt (MXN)',
  'costs.installationCost': 'Costo instalación por kW',
  'costs.structureCostPercent': 'Estructura (% del equipo)',
  'costs.electricalMaterialsPercent': 'Materiales eléctricos (%)',
  'payments.anticipoPercent': 'Anticipo (%)',
  'payments.materialesPercent': 'Materiales (%)',
  'payments.finiquitoPercent': 'Finiquito (%)',
  'tax.ivaPercent': 'IVA (%)',
  'notifications.emailEnabled': 'Email habilitado',
  'notifications.emailHost': 'Servidor SMTP (host)',
  'notifications.emailPort': 'Puerto SMTP',
  'notifications.emailSecure': 'Conexión segura (TLS/SSL)',
  'notifications.emailUser': 'Usuario/correo SMTP',
  'notifications.emailPass': 'Contraseña SMTP',
  'notifications.emailFrom': 'Remitente (nombre y correo)',
};

// Tipos de input para cada configuración
const CONFIG_TYPES: Record<string, 'text' | 'number' | 'boolean' | 'image'> = {
  'company.name': 'text',
  'company.phone': 'text',
  'company.email': 'text',
  'company.address': 'text',
  'company.logo': 'image',
  'quotation.validityDays': 'number',
  'quotation.defaultMargin': 'number',
  'quotation.defaultDiscount': 'number',
  'solar.defaultPanelPower': 'number',
  'solar.systemEfficiency': 'number',
  'solar.defaultHSP': 'number',
  'costs.pricePerWatt': 'number',
  'costs.installationCost': 'number',
  'costs.structureCostPercent': 'number',
  'costs.electricalMaterialsPercent': 'number',
  'payments.anticipoPercent': 'number',
  'payments.materialesPercent': 'number',
  'payments.finiquitoPercent': 'number',
  'tax.ivaPercent': 'number',
  'notifications.emailEnabled': 'boolean',
  'notifications.emailHost': 'text',
  'notifications.emailPort': 'number',
  'notifications.emailSecure': 'boolean',
  'notifications.emailUser': 'text',
  'notifications.emailPass': 'password',
  'notifications.emailFrom': 'text',
};

export default function ConfigPage() {
  // Estado para prueba de email
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  // Probar envío de correo
  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      await api.post('/notifications/test-email', { to: testEmail });
      toast.success('Correo de prueba enviado correctamente');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al enviar correo de prueba');
    } finally {
      setTestingEmail(false);
    }
  };
  const { data: configGroups, isLoading } = useConfigsGrouped();
  const setConfigs = useSetConfigs();
  const initializeDefaults = useInitializeDefaults();
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (configGroups) {
      const initialData: Record<string, string> = {};
      Object.values(configGroups).forEach(configs => {
        configs.forEach(config => {
          initialData[config.key] = config.value;
        });
      });
      setFormData(initialData);
    }
  }, [configGroups]);

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await setConfigs.mutateAsync(formData);
    setHasChanges(false);
  };

  const handleInitialize = async () => {
    await initializeDefaults.mutateAsync();
  };

  // Manejar subida de logo
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es muy grande. Máximo 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const response = await api.post('/upload/image', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data.data.url;
      handleChange('company.logo', imageUrl);
      toast.success('Logo subido exitosamente');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al subir el logo');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Eliminar logo
  const handleRemoveLogo = () => {
    handleChange('company.logo', '');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-500 mt-1">Administra la configuración general del sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleInitialize}
            disabled={initializeDefaults.isPending}
            className="btn-secondary inline-flex items-center gap-2"
          >
            {initializeDefaults.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Restaurar Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || setConfigs.isPending}
            className="btn-primary inline-flex items-center gap-2"
          >
            {setConfigs.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Config Groups */}
      <div className="grid gap-6">
        {Object.entries(CONFIG_GROUPS).map(([groupKey, groupInfo]) => {
          const configs = configGroups?.[groupKey] || [];
          const Icon = groupInfo.icon;
          
          if (configs.length === 0) return null;
          
          // Si es grupo de notificaciones, agregar UI para probar email
          const isNotifications = groupKey === 'notifications';
          return (
            <div key={groupKey} className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 bg-${groupInfo.color}-100 rounded-lg`}>
                  <Icon className={`w-5 h-5 text-${groupInfo.color}-600`} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{groupInfo.label}</h2>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {configs.map((config) => {
                  const type = CONFIG_TYPES[config.key] || 'text';
                  const label = CONFIG_LABELS[config.key] || config.key;
                  
                  return (
                    <div key={config.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                      </label>
                      
                      {type === 'image' ? (
                        <div className="space-y-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          
                          {formData[config.key] ? (
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img
                                  src={formData[config.key]}
                                  alt="Logo"
                                  className="h-16 w-auto object-contain border rounded"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={handleRemoveLogo}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                  title="Eliminar logo"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingLogo}
                                className="btn-secondary btn-sm"
                              >
                                Cambiar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingLogo}
                              className="btn-secondary inline-flex items-center gap-2"
                            >
                              {uploadingLogo ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                              {uploadingLogo ? 'Subiendo...' : 'Subir Logo'}
                            </button>
                          )}
                        </div>
                      ) : type === 'boolean' ? (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData[config.key] === 'true'}
                            onChange={(e) => handleChange(config.key, e.target.checked ? 'true' : 'false')}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-600">
                            {formData[config.key] === 'true' ? 'Habilitado' : 'Deshabilitado'}
                          </span>
                        </label>
                      ) : type === 'number' ? (
                        <input
                          type="number"
                          value={formData[config.key] || ''}
                          onChange={(e) => handleChange(config.key, e.target.value)}
                          className="input w-full"
                          step="any"
                        />
                      ) : type === 'password' ? (
                        <input
                          type="password"
                          value={formData[config.key] || ''}
                          onChange={(e) => handleChange(config.key, e.target.value)}
                          className="input w-full"
                          autoComplete="new-password"
                        />
                      ) : (
                        <input
                          type="text"
                          value={formData[config.key] || ''}
                          onChange={(e) => handleChange(config.key, e.target.value)}
                          className="input w-full"
                        />
                      )}
                      
                      {config.description && (
                        <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            {isNotifications && (
              <div className="mt-6 p-4 border rounded-lg bg-indigo-50">
                <h3 className="font-semibold text-indigo-800 mb-2">Probar envío de correo</h3>
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <input
                    type="email"
                    placeholder="Correo de destino para prueba"
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                    className="input w-full max-w-xs"
                  />
                  <button
                    onClick={handleTestEmail}
                    disabled={testingEmail || !testEmail}
                    className="btn-primary"
                  >
                    {testingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Probar envío'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Se enviará un correo de prueba usando la configuración SMTP actual.</p>
              </div>
            )}
            </div>
          );
        })}
      </div>

      {/* Unsaved changes warning */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
          <span className="text-yellow-800 text-sm font-medium">
            Tienes cambios sin guardar
          </span>
          <button
            onClick={handleSave}
            disabled={setConfigs.isPending}
            className="btn-primary btn-sm"
          >
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}
