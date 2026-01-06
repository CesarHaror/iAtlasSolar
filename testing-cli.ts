#!/usr/bin/env node

/**
 * TESTING CLI - Herramienta interactiva para validar OCR
 * 
 * Uso:
 *   npm install -g ts-node
 *   ts-node testing-cli.ts
 */

import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface TestConfig {
  apiUrl: string;
  token: string;
  filePath?: string;
  groundTruthPath?: string;
}

class TestingCLI {
  private api: AxiosInstance;
  private config: TestConfig;
  private rl: readline.Interface;

  constructor() {
    this.config = {
      apiUrl: process.env.API_URL || 'http://localhost:3000',
      token: process.env.TEST_TOKEN || ''
    };

    this.api = axios.create({
      baseURL: `${this.config.apiUrl}/api/testing`,
      headers: {
        'Authorization': `Bearer ${this.config.token}`
      }
    });

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  private question(prompt: string): Promise<string> {
    return new Promise(resolve => {
      this.rl.question(prompt, resolve);
    });
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warn: '\x1b[33m'     // Yellow
    };
    const reset = '\x1b[0m';
    console.log(`${colors[type]}${message}${reset}`);
  }

  async getExamples(): Promise<void> {
    this.log('Obteniendo ejemplos de recibos CFE...', 'info');
    try {
      const response = await this.api.get('/dataset/examples');
      console.log(JSON.stringify(response.data.data.examples, null, 2));
      this.log('✅ Ejemplos obtenidos', 'success');
    } catch (error) {
      this.log('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    }
  }

  async getTemplate(): Promise<void> {
    this.log('Obteniendo plantilla...', 'info');
    try {
      const response = await this.api.get('/dataset/template');
      console.log(JSON.stringify(response.data.data, null, 2));
      this.log('✅ Plantilla obtenida', 'success');
    } catch (error) {
      this.log('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    }
  }

  async generateDataset(): Promise<void> {
    try {
      const countStr = await this.question('¿Cuántos recibos de ejemplo? (1-100) [10]: ');
      const count = Math.min(Math.max(parseInt(countStr) || 10, 1), 100);

      this.log(`Generando ${count} recibos de ejemplo...`, 'info');
      const response = await this.api.post('/dataset/generate', {
        count,
        includeVariations: true
      });

      console.log(JSON.stringify(response.data.data, null, 2));
      this.log(`✅ Dataset de ${count} recibos generado`, 'success');

      // Guardar a archivo
      const shouldSave = await this.question('¿Guardar en archivo? (s/n) [s]: ');
      if (shouldSave.toLowerCase() !== 'n') {
        const fileName = `testing-dataset-${Date.now()}.json`;
        fs.writeFileSync(fileName, JSON.stringify(response.data.data, null, 2));
        this.log(`📁 Guardado en: ${fileName}`, 'success');
      }
    } catch (error) {
      this.log('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    }
  }

  async validateSingleReceipt(): Promise<void> {
    try {
      const filePath = await this.question('Ruta del recibo (PDF/imagen): ');
      const groundTruthPath = await this.question('Ruta del ground truth (JSON): ');

      if (!fs.existsSync(filePath)) {
        this.log('❌ Archivo de recibo no encontrado', 'error');
        return;
      }

      if (!fs.existsSync(groundTruthPath)) {
        this.log('❌ Archivo de ground truth no encontrado', 'error');
        return;
      }

      this.log('Validando recibo...', 'info');

      const fileBuffer = fs.readFileSync(filePath);
      const groundTruthJson = JSON.parse(fs.readFileSync(groundTruthPath, 'utf-8'));

      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: 'application/pdf' });
      formData.append('file', blob, path.basename(filePath));
      formData.append('groundTruth', new Blob([JSON.stringify(groundTruthJson)], { type: 'application/json' }));

      const response = await this.api.post('/ocr/validate-single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log(JSON.stringify(response.data.data, null, 2));
      this.log(`✅ Validación completada (Accuracy: ${response.data.data.validation.overallAccuracy}%)`, 'success');
    } catch (error) {
      this.log('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    }
  }

  async viewMetrics(): Promise<void> {
    try {
      this.log('Obteniendo métricas...', 'info');
      const response = await this.api.get('/ocr/metrics');
      console.log(JSON.stringify(response.data.data, null, 2));
      this.log('✅ Métricas obtenidas', 'success');
    } catch (error) {
      this.log('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    }
  }

  async downloadReport(): Promise<void> {
    try {
      const format = await this.question('Formato (html/json) [html]: ');
      const isJson = format.toLowerCase() === 'json';

      this.log(`Descargando reporte en ${isJson ? 'JSON' : 'HTML'}...`, 'info');

      const endpoint = isJson ? '/ocr/report/json' : '/ocr/report/html';
      const response = await this.api.get(endpoint);

      const fileName = `ocr-validation-report.${isJson ? 'json' : 'html'}`;
      const content = isJson ? JSON.stringify(response.data, null, 2) : response.data;

      fs.writeFileSync(fileName, content);
      this.log(`📁 Reporte guardado en: ${fileName}`, 'success');
    } catch (error) {
      this.log('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    }
  }

  async clearResults(): Promise<void> {
    try {
      const confirm = await this.question('¿Eliminar todos los resultados de test? (s/n) [n]: ');
      if (confirm.toLowerCase() !== 's') {
        this.log('Cancelado', 'warn');
        return;
      }

      this.log('Eliminando resultados...', 'info');
      await this.api.delete('/ocr/results');
      this.log('✅ Resultados eliminados', 'success');
    } catch (error) {
      this.log('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown'), 'error');
    }
  }

  async showMenu(): Promise<void> {
    console.clear();
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║        🧪 TESTING FRAMEWORK - HERRAMIENTA INTERACTIVA       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('1. 📚 Ver ejemplos de recibos CFE');
    console.log('2. 📋 Ver plantilla de ground truth');
    console.log('3. 🎲 Generar dataset de testing');
    console.log('4. ✅ Validar un recibo real');
    console.log('5. 📊 Ver métricas de precisión');
    console.log('6. 📥 Descargar reporte (HTML/JSON)');
    console.log('7. 🗑️  Limpiar resultados de tests');
    console.log('8. ❌ Salir\n');

    const choice = await this.question('Selecciona opción (1-8): ');

    switch (choice) {
      case '1':
        await this.getExamples();
        break;
      case '2':
        await this.getTemplate();
        break;
      case '3':
        await this.generateDataset();
        break;
      case '4':
        await this.validateSingleReceipt();
        break;
      case '5':
        await this.viewMetrics();
        break;
      case '6':
        await this.downloadReport();
        break;
      case '7':
        await this.clearResults();
        break;
      case '8':
        this.log('👋 ¡Hasta luego!', 'info');
        this.rl.close();
        process.exit(0);
        return;
      default:
        this.log('❌ Opción inválida', 'error');
    }

    const continueStr = await this.question('\n¿Continuar? (s/n) [s]: ');
    if (continueStr.toLowerCase() !== 'n') {
      await this.showMenu();
    } else {
      this.rl.close();
      process.exit(0);
    }
  }

  async start(): Promise<void> {
    if (!this.config.token) {
      this.log('⚠️  TOKEN no configurado', 'warn');
      console.log('Opciones:');
      console.log('1. Establecer variable de entorno: export TEST_TOKEN="tu_token"');
      console.log('2. Introducir token ahora:');

      const token = await this.question('Token: ');
      if (!token) {
        this.log('❌ Token requerido', 'error');
        this.rl.close();
        process.exit(1);
      }
      this.config.token = token;
      this.api.defaults.headers['Authorization'] = `Bearer ${token}`;
    }

    await this.showMenu();
  }
}

// Ejecutar
const cli = new TestingCLI();
cli.start().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
