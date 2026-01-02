// =====================================================
// CONFIGURACIÓN DE BASE DE DATOS (PRISMA)
// =====================================================

import { PrismaClient } from '@prisma/client';

// Crear instancia de Prisma con logging solo de errores y advertencias
// Nota: 'query' está deshabilitado para mantener la consola limpia
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['error', 'warn'] 
    : ['error'],
});

// Manejar cierre graceful de la conexión
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };
export default prisma;
