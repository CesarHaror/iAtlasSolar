// =====================================================
// SERVICIO DE CONFIGURACIÓN DEL SISTEMA
// =====================================================

import { prisma } from '../../config/database.js';

// Configuraciones predeterminadas
const DEFAULT_CONFIGS: Record<string, { value: string; description: string }> = {
  // Empresa
  'company.name': { value: 'Atlas Solar', description: 'Nombre de la empresa' },
  'company.phone': { value: '', description: 'Teléfono de la empresa' },
  'company.email': { value: '', description: 'Email de la empresa' },
  'company.address': { value: '', description: 'Dirección de la empresa' },
  'company.logo': { value: '', description: 'URL del logo' },
  
  // Cotizaciones
  'quotation.validityDays': { value: '30', description: 'Días de validez de cotización' },
  'quotation.defaultMargin': { value: '30', description: 'Margen de ganancia predeterminado (%)' },
  'quotation.defaultDiscount': { value: '0', description: 'Descuento predeterminado (%)' },
  
  // Sistema Solar
  'solar.defaultPanelPower': { value: '550', description: 'Potencia de panel predeterminada (W)' },
  'solar.systemEfficiency': { value: '0.80', description: 'Eficiencia del sistema' },
  'solar.defaultHSP': { value: '5.5', description: 'HSP predeterminado' },
  
  // Costos
  'costs.pricePerWatt': { value: '14', description: 'Precio por Watt instalado (MXN)' },
  'costs.installationCost': { value: '3000', description: 'Costo de instalación por kW' },
  'costs.structureCostPercent': { value: '8', description: 'Costo de estructura (% del equipo)' },
  'costs.electricalMaterialsPercent': { value: '5', description: 'Materiales eléctricos (% del equipo)' },
  
  // Pagos
  'payments.anticipoPercent': { value: '50', description: 'Porcentaje de anticipo' },
  'payments.materialesPercent': { value: '40', description: 'Porcentaje en materiales' },
  'payments.finiquitoPercent': { value: '10', description: 'Porcentaje de finiquito' },
  
  // IVA
  'tax.ivaPercent': { value: '16', description: 'Porcentaje de IVA' },
  
  // Notificaciones
  'notifications.emailEnabled': { value: 'true', description: 'Notificaciones por email habilitadas' },
  'notifications.emailHost': { value: 'smtp.gmail.com', description: 'Servidor SMTP (host)' },
  'notifications.emailPort': { value: '587', description: 'Puerto SMTP' },
  'notifications.emailSecure': { value: 'false', description: 'Usar conexión segura (TLS/SSL)' },
  'notifications.emailUser': { value: '', description: 'Usuario/correo SMTP' },
  'notifications.emailPass': { value: '', description: 'Contraseña SMTP (no se muestra)' },
  'notifications.emailFrom': { value: '', description: 'Remitente (nombre y correo)' },
};

// Obtener todas las configuraciones
export async function getAllConfigs() {
  const configs = await prisma.systemConfig.findMany({
    orderBy: { key: 'asc' },
  });
  
  // Convertir a objeto
  const configMap: Record<string, string> = {};
  configs.forEach(c => {
    configMap[c.key] = c.value;
  });
  
  return configMap;
}

// Obtener configuración por clave
export async function getConfig(key: string) {
  const config = await prisma.systemConfig.findUnique({
    where: { key },
  });
  
  if (!config) {
    // Devolver valor predeterminado si existe
    return DEFAULT_CONFIGS[key]?.value || null;
  }
  
  return config.value;
}

// Obtener múltiples configuraciones
export async function getConfigs(keys: string[]) {
  const configs = await prisma.systemConfig.findMany({
    where: { key: { in: keys } },
  });
  
  const configMap: Record<string, string> = {};
  
  // Primero agregar defaults
  keys.forEach(key => {
    if (DEFAULT_CONFIGS[key]) {
      configMap[key] = DEFAULT_CONFIGS[key].value;
    }
  });
  
  // Luego sobrescribir con valores de BD
  configs.forEach(c => {
    configMap[c.key] = c.value;
  });
  
  return configMap;
}

// Establecer configuración
export async function setConfig(key: string, value: string, description?: string) {
  return prisma.systemConfig.upsert({
    where: { key },
    create: {
      key,
      value,
      description: description || DEFAULT_CONFIGS[key]?.description,
    },
    update: {
      value,
      description: description || undefined,
    },
  });
}

// Establecer múltiples configuraciones
export async function setConfigs(configs: Record<string, string>) {
  const operations = Object.entries(configs).map(([key, value]) => 
    prisma.systemConfig.upsert({
      where: { key },
      create: {
        key,
        value,
        description: DEFAULT_CONFIGS[key]?.description,
      },
      update: { value },
    })
  );
  
  return prisma.$transaction(operations);
}

// Eliminar configuración
export async function deleteConfig(key: string) {
  return prisma.systemConfig.delete({
    where: { key },
  });
}

// Inicializar configuraciones predeterminadas
export async function initializeDefaults() {
  const existingConfigs = await prisma.systemConfig.findMany();
  const existingKeys = new Set(existingConfigs.map(c => c.key));
  
  const newConfigs = Object.entries(DEFAULT_CONFIGS)
    .filter(([key]) => !existingKeys.has(key))
    .map(([key, { value, description }]) => ({
      key,
      value,
      description,
    }));
  
  if (newConfigs.length > 0) {
    await prisma.systemConfig.createMany({
      data: newConfigs,
    });
  }
  
  return newConfigs.length;
}

// Obtener configuraciones agrupadas
export async function getConfigsGrouped() {
  const allConfigs = await prisma.systemConfig.findMany({
    orderBy: { key: 'asc' },
  });
  
  // Agrupar por prefijo
  const groups: Record<string, Array<{ key: string; value: string; description: string | null }>> = {};
  
  // Primero agregar defaults
  Object.entries(DEFAULT_CONFIGS).forEach(([key, { value, description }]) => {
    const [group] = key.split('.');
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push({ key, value, description });
  });
  
  // Sobrescribir con valores de BD
  allConfigs.forEach(config => {
    const [group] = config.key.split('.');
    if (groups[group]) {
      const idx = groups[group].findIndex(c => c.key === config.key);
      if (idx >= 0) {
        groups[group][idx] = config;
      } else {
        groups[group].push(config);
      }
    } else {
      groups[group] = [config];
    }
  });
  
  return groups;
}
