// =====================================================
// CONFIGURACIÓN GENERAL
// =====================================================

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Servidor
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // Bcrypt
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  
  // Email
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'iAtlas Solar <noreply@atlassolar.mx>',
  },
  
  // Twilio (WhatsApp)
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM || '',
  },
  
  // Configuración Solar (defaults)
  solar: {
    defaultPanelPower: parseInt(process.env.DEFAULT_PANEL_POWER || '400', 10),
    defaultPricePerWatt: parseFloat(process.env.DEFAULT_PRICE_PER_WATT || '22'),
    defaultEfficiency: parseFloat(process.env.DEFAULT_SYSTEM_EFFICIENCY || '0.80'),
    defaultPanelBrand: process.env.DEFAULT_PANEL_BRAND || 'Canadian Solar',
    defaultPanelModel: process.env.DEFAULT_PANEL_MODEL || 'CS3W-400P',
  },
};

export default config;
