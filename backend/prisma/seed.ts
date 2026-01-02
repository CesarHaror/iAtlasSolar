// =====================================================
// SEED - Datos Iniciales para Atlas Solar
// =====================================================

import { PrismaClient, Role, CFETariff } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...\n');

  // =====================================================
  // 1. CREAR USUARIO ADMIN
  // =====================================================
  console.log('👤 Creando usuario administrador...');
  
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@atlassolar.mx' },
    update: {},
    create: {
      email: 'admin@atlassolar.mx',
      password: hashedPassword,
      name: 'Administrador',
      phone: '+52 33 1234 5678',
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`   ✅ Admin creado: ${admin.email}`);

  // Crear vendedor de ejemplo
  const vendedor = await prisma.user.upsert({
    where: { email: 'vendedor@atlassolar.mx' },
    update: {},
    create: {
      email: 'vendedor@atlassolar.mx',
      password: hashedPassword,
      name: 'Juan Vendedor',
      phone: '+52 33 9876 5432',
      role: Role.VENDEDOR,
      isActive: true,
    },
  });
  console.log(`   ✅ Vendedor creado: ${vendedor.email}`);

  // =====================================================
  // 2. HSP POR CIUDAD
  // =====================================================
  console.log('\n☀️ Insertando datos de HSP por ciudad...');
  
  const cities = [
    { city: 'Guadalajara', state: 'Jalisco', hsp: 5.5, latitude: 20.6597, longitude: -103.3496 },
    { city: 'Monterrey', state: 'Nuevo León', hsp: 5.7, latitude: 25.6866, longitude: -100.3161 },
    { city: 'Ciudad de México', state: 'CDMX', hsp: 5.3, latitude: 19.4326, longitude: -99.1332 },
    { city: 'Hermosillo', state: 'Sonora', hsp: 6.2, latitude: 29.0729, longitude: -110.9559 },
    { city: 'Cancún', state: 'Quintana Roo', hsp: 5.4, latitude: 21.1619, longitude: -86.8515 },
    { city: 'Tijuana', state: 'Baja California', hsp: 5.8, latitude: 32.5149, longitude: -117.0382 },
    { city: 'Puebla', state: 'Puebla', hsp: 5.4, latitude: 19.0414, longitude: -98.2063 },
    { city: 'Mérida', state: 'Yucatán', hsp: 5.6, latitude: 20.9674, longitude: -89.5926 },
    { city: 'León', state: 'Guanajuato', hsp: 5.5, latitude: 21.1221, longitude: -101.6860 },
    { city: 'Querétaro', state: 'Querétaro', hsp: 5.5, latitude: 20.5888, longitude: -100.3899 },
    { city: 'Chihuahua', state: 'Chihuahua', hsp: 6.0, latitude: 28.6353, longitude: -106.0889 },
    { city: 'Aguascalientes', state: 'Aguascalientes', hsp: 5.6, latitude: 21.8818, longitude: -102.2916 },
    { city: 'Morelia', state: 'Michoacán', hsp: 5.4, latitude: 19.7060, longitude: -101.1950 },
    { city: 'San Luis Potosí', state: 'San Luis Potosí', hsp: 5.5, latitude: 22.1565, longitude: -100.9855 },
    { city: 'Culiacán', state: 'Sinaloa', hsp: 5.9, latitude: 24.8091, longitude: -107.3940 },
    { city: 'Mexicali', state: 'Baja California', hsp: 6.3, latitude: 32.6519, longitude: -115.4683 },
    { city: 'La Paz', state: 'Baja California Sur', hsp: 6.1, latitude: 24.1426, longitude: -110.3128 },
    { city: 'Torreón', state: 'Coahuila', hsp: 5.8, latitude: 25.5428, longitude: -103.4068 },
    { city: 'Durango', state: 'Durango', hsp: 5.7, latitude: 24.0277, longitude: -104.6532 },
    { city: 'Mazatlán', state: 'Sinaloa', hsp: 5.8, latitude: 23.2494, longitude: -106.4111 },
  ];

  for (const city of cities) {
    await prisma.cityHSP.upsert({
      where: { city: city.city },
      update: city,
      create: city,
    });
  }
  console.log(`   ✅ ${cities.length} ciudades insertadas`);

  // =====================================================
  // 3. CATÁLOGO DE PANELES
  // =====================================================
  console.log('\n🔲 Insertando catálogo de paneles...');
  
  const panels = [
    { brand: 'Canadian Solar', model: 'CS3W-400P', power: 400, efficiency: 20.2, warranty: 25, price: 3200 },
    { brand: 'Canadian Solar', model: 'CS3W-450P', power: 450, efficiency: 20.8, warranty: 25, price: 3600 },
    { brand: 'Canadian Solar', model: 'CS6R-410MS', power: 410, efficiency: 21.0, warranty: 25, price: 3400 },
    { brand: 'JA Solar', model: 'JAM72S30-540', power: 540, efficiency: 21.3, warranty: 25, price: 4200 },
    { brand: 'JA Solar', model: 'JAM60S20-385', power: 385, efficiency: 20.4, warranty: 25, price: 3000 },
    { brand: 'Longi', model: 'LR5-54HPH-410M', power: 410, efficiency: 21.1, warranty: 25, price: 3300 },
    { brand: 'Longi', model: 'LR5-72HPH-545M', power: 545, efficiency: 21.2, warranty: 25, price: 4300 },
    { brand: 'Trina Solar', model: 'TSM-DE19-540', power: 540, efficiency: 21.0, warranty: 25, price: 4100 },
    { brand: 'Trina Solar', model: 'TSM-DE09-400', power: 400, efficiency: 20.5, warranty: 25, price: 3150 },
    { brand: 'Jinko Solar', model: 'JKM545M-72HL4', power: 545, efficiency: 21.18, warranty: 25, price: 4250 },
  ];

  for (const panel of panels) {
    await prisma.panelCatalog.upsert({
      where: { brand_model: { brand: panel.brand, model: panel.model } },
      update: panel,
      create: panel,
    });
  }
  console.log(`   ✅ ${panels.length} paneles insertados`);

  // =====================================================
  // 4. CATÁLOGO DE INVERSORES
  // =====================================================
  console.log('\n⚡ Insertando catálogo de inversores...');
  
  const inverters = [
    { brand: 'Fronius', model: 'Primo 3.0-1', power: 3.0, phases: 1, warranty: 10, price: 18000 },
    { brand: 'Fronius', model: 'Primo 5.0-1', power: 5.0, phases: 1, warranty: 10, price: 22000 },
    { brand: 'Fronius', model: 'Primo 6.0-1', power: 6.0, phases: 1, warranty: 10, price: 25000 },
    { brand: 'Fronius', model: 'Primo 8.2-1', power: 8.2, phases: 1, warranty: 10, price: 30000 },
    { brand: 'Fronius', model: 'Symo 10.0-3', power: 10.0, phases: 3, warranty: 10, price: 38000 },
    { brand: 'Fronius', model: 'Symo 12.5-3', power: 12.5, phases: 3, warranty: 10, price: 45000 },
    { brand: 'Huawei', model: 'SUN2000-3KTL-L1', power: 3.0, phases: 1, warranty: 10, price: 15000 },
    { brand: 'Huawei', model: 'SUN2000-5KTL-L1', power: 5.0, phases: 1, warranty: 10, price: 19000 },
    { brand: 'Huawei', model: 'SUN2000-8KTL-M1', power: 8.0, phases: 3, warranty: 10, price: 28000 },
    { brand: 'Huawei', model: 'SUN2000-10KTL-M1', power: 10.0, phases: 3, warranty: 10, price: 35000 },
    { brand: 'GoodWe', model: 'GW3000-NS', power: 3.0, phases: 1, warranty: 10, price: 12000 },
    { brand: 'GoodWe', model: 'GW5000-NS', power: 5.0, phases: 1, warranty: 10, price: 16000 },
    { brand: 'Solis', model: 'S6-GR1P3K', power: 3.0, phases: 1, warranty: 10, price: 10000 },
    { brand: 'Solis', model: 'S6-GR1P5K', power: 5.0, phases: 1, warranty: 10, price: 14000 },
  ];

  for (const inverter of inverters) {
    await prisma.inverterCatalog.upsert({
      where: { brand_model: { brand: inverter.brand, model: inverter.model } },
      update: inverter,
      create: inverter,
    });
  }
  console.log(`   ✅ ${inverters.length} inversores insertados`);

  // =====================================================
  // 5. CONFIGURACIÓN DEL SISTEMA
  // =====================================================
  console.log('\n⚙️ Insertando configuración del sistema...');
  
  const configs = [
    { key: 'default_panel_power', value: '400', description: 'Potencia default de paneles (W)' },
    { key: 'default_price_per_watt', value: '22', description: 'Precio por watt instalado ($)' },
    { key: 'default_system_efficiency', value: '0.80', description: 'Eficiencia del sistema (0-1)' },
    { key: 'default_profit_margin', value: '30', description: 'Margen de utilidad default (%)' },
    { key: 'quotation_validity_days', value: '30', description: 'Días de validez de cotización' },
    { key: 'company_name', value: 'iAtlas Solar', description: 'Nombre de la empresa' },
    { key: 'company_phone', value: '+52 33 1234 5678', description: 'Teléfono de la empresa' },
    { key: 'company_email', value: 'info@atlassolar.mx', description: 'Email de la empresa' },
    { key: 'company_address', value: 'Guadalajara, Jalisco, México', description: 'Dirección de la empresa' },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: config,
      create: config,
    });
  }
  console.log(`   ✅ ${configs.length} configuraciones insertadas`);

  // =====================================================
  // 6. CLIENTE DE EJEMPLO
  // =====================================================
  console.log('\n👥 Creando cliente de ejemplo...');
  
  const client = await prisma.client.upsert({
    where: { email: 'cliente.ejemplo@gmail.com' },
    update: {},
    create: {
      name: 'Juan Pérez García',
      email: 'cliente.ejemplo@gmail.com',
      phone: '+52 33 5555 1234',
      rfc: 'PEGJ850101ABC',
      address: 'Av. Vallarta 1234, Col. Americana',
      city: 'Guadalajara',
      state: 'Jalisco',
      postalCode: '44160',
      cfeTariff: CFETariff.T1C,
      source: 'Referido',
      notes: 'Cliente de ejemplo para pruebas',
    },
  });
  console.log(`   ✅ Cliente creado: ${client.name}`);

  console.log('\n✨ Seed completado exitosamente!\n');
  console.log('📋 Resumen:');
  console.log('   - 2 usuarios (admin y vendedor)');
  console.log(`   - ${cities.length} ciudades con HSP`);
  console.log(`   - ${panels.length} paneles en catálogo`);
  console.log(`   - ${inverters.length} inversores en catálogo`);
  console.log(`   - ${configs.length} configuraciones`);
  console.log('   - 1 cliente de ejemplo\n');
  console.log('🔐 Credenciales de acceso:');
  console.log('   Admin: admin@atlassolar.mx / Admin123!');
  console.log('   Vendedor: vendedor@atlassolar.mx / Admin123!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
