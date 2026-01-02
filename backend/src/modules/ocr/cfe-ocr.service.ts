// =====================================================
// SERVICIO OCR - ANÁLISIS DE RECIBOS CFE (PDF)
// 100% Gratuito - Extrae texto directamente del PDF
// =====================================================

import fs from 'fs';
import path from 'path';
import { CFETariff } from '@prisma/client';

// pdf-parse se importará dinámicamente
type PdfParseFunction = (dataBuffer: Buffer, options?: any) => Promise<{ text: string; numpages: number; info: any }>;
let pdfParseCache: PdfParseFunction | null = null;

async function getPdfParser(): Promise<PdfParseFunction> {
  if (!pdfParseCache) {
    // @ts-ignore - pdf-parse tiene exports no estándar
    const module = await import('pdf-parse');
    pdfParseCache = (module as any).default || (module as any);
  }
  return pdfParseCache as PdfParseFunction;
}

// Interfaz para los datos extraídos del recibo CFE
export interface CFEReceiptData {
  serviceNumber: string | null;
  rmu: string | null;
  clientName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  tariff: CFETariff | null;
  consumption: {
    currentPeriod: number | null;
    previousPeriod: number | null;
    average: number | null;
    monthly: number | null;
    // NUEVO: Historial de consumo para cálculos más precisos
    history: {
      period: string;
      kwh: number;
      amount: number | null;
    }[];
    historicalAverage: number | null;  // Promedio de todos los periodos históricos
  };
  billing: {
    totalAmount: number | null;
    periodStart: string | null;
    periodEnd: string | null;
    dueDate: string | null;
    // NUEVO: Gasto promedio calculado del historial
    averageAmount: number | null;
    historicalAmounts: number[];  // Lista de montos históricos
  };
  industrial?: {
    demandKw: number | null;
    powerFactor: number | null;
    consumptionBase: number | null;
    consumptionIntermediate: number | null;
    consumptionPeak: number | null;
  };
  confidence: number;
  rawText?: string;
  warnings: string[];
}

const MEXICAN_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'CDMX', 'Coahuila', 'Colima',
  'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
  'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

export class CFEReceiptAnalyzer {
  private isReady: boolean = true;
  
  constructor() {
    console.log('📄 CFE Receipt Analyzer - Soporte para PDF');
  }
  
  isConfigured(): boolean {
    return this.isReady;
  }
  
  /**
   * Extrae texto de un archivo PDF
   */
  private async extractTextFromPDF(pdfPath: string): Promise<string> {
    const pdf = await getPdfParser();
    const dataBuffer = fs.readFileSync(pdfPath);
    
    // Opciones para evitar que pdf-parse intente cargar archivos de test
    const options = {
      // Función personalizada para renderizar páginas (evita el bug de test files)
      pagerender: function(pageData: any) {
        return pageData.getTextContent().then(function(textContent: any) {
          let text = '';
          for (let item of textContent.items) {
            text += item.str + ' ';
          }
          return text;
        });
      }
    };
    
    const data = await pdf(dataBuffer, options);
    return data.text;
  }
  
  /**
   * Parsea el texto extraído para encontrar datos del recibo CFE
   */
  private parseReceiptText(text: string): Partial<CFEReceiptData> {
    const result: Partial<CFEReceiptData> = {
      consumption: {
        currentPeriod: null,
        previousPeriod: null,
        average: null,
        monthly: null,
        history: [],
        historicalAverage: null,
      },
      billing: {
        totalAmount: null,
        periodStart: null,
        periodEnd: null,
        dueDate: null,
        averageAmount: null,
        historicalAmounts: [],
      },
      warnings: [],
    };
    
    const normalizedText = text.toUpperCase();
    
    // =====================================================
    // EXTRAER NÚMERO DE SERVICIO (12 dígitos)
    // =====================================================
    const servicePatterns = [
      /N[UÚ]MERO\s*DE\s*SERVICIO[:\s]*(\d{12})/i,
      /NO\.\s*DE\s*SERVICIO[:\s]*(\d{12})/i,
      /SERVICIO[:\s]*(\d{12})/i,
      /RPU[:\s]*(\d{12})/i,
    ];
    
    for (const pattern of servicePatterns) {
      const match = text.match(pattern);
      if (match) {
        result.serviceNumber = match[1];
        break;
      }
    }
    
    if (!result.serviceNumber) {
      const twelveDigits = text.match(/\b(\d{12})\b/);
      if (twelveDigits) {
        result.serviceNumber = twelveDigits[1];
      }
    }
    
    // =====================================================
    // EXTRAER TARIFA CFE
    // =====================================================
    // Priorizar el valor exacto que aparece en "TARIFA: XXX" o "TARIFA:XXX"
    // Nota: A veces viene pegado como "TARIFA:PDBTNO. MEDIDOR"
    const tariffPatterns = [
      // Patrón principal: buscar "TARIFA:" seguido del valor (puede estar pegado a NO. MEDIDOR)
      /TARIFA[:\s]*(GDMTH|GDMTO|PDBT|DAC|1F|1E|1D|1C|1B|1A|01|1)(?:NO\.|[\s\n]|$)/i,
      // Patrón alternativo con espacio
      /TARIFA[:\s]+(GDMTH|GDMTO|PDBT|DAC|1F|1E|1D|1C|1B|1A|01|1)\b/i,
      // Patrones de fallback si no se encuentra con etiqueta
      /\b(PDBT)\b/i,
      /\b(GDMTH|GDMTO)\b/i,
      /\b(DAC)\b/i,
    ];
    
    let rawTariff: string | null = null;
    
    for (const pattern of tariffPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        rawTariff = match[1].toUpperCase();
        result.tariff = this.mapTariff(rawTariff);
        console.log(`✓ Tarifa encontrada: ${rawTariff} -> ${result.tariff}`);
        break;
      }
    }
    
    // =====================================================
    // EXTRAER CONSUMO EN kWh
    // =====================================================
    // Los recibos CFE muestran las lecturas del medidor en formato:
    // Lectura actual | Lectura anterior | Consumo (diferencia)
    // Ejemplo: "57,804 54,775 3,029" o "4,098 3,199 899"
    
    console.log('\n=== BUSCANDO CONSUMO ===');
    
    // Método 1: Buscar el patrón de tres números consecutivos (lecturas y consumo)
    // Los recibos CFE muestran: LecturaActual LecturaAnterior Consumo
    // Los números pueden tener comas como separador de miles
    const readingsPattern = /(\d{1,3}(?:,\d{3})*)\s+(\d{1,3}(?:,\d{3})*)\s+(\d{1,3}(?:,\d{3})*)\s+(?:Suministro|Basico|Intermedio|Punta|Base)/i;
    const readingsMatch = text.match(readingsPattern);
    
    if (readingsMatch) {
      const currentReading = parseInt(readingsMatch[1].replace(/,/g, ''));
      const previousReading = parseInt(readingsMatch[2].replace(/,/g, ''));
      const consumption = parseInt(readingsMatch[3].replace(/,/g, ''));
      
      console.log(`Lecturas encontradas: actual=${currentReading}, anterior=${previousReading}, consumo=${consumption}`);
      
      // El tercer número es el consumo del periodo (diferencia de lecturas)
      if (consumption > 50 && consumption < 100000) {
        result.consumption!.currentPeriod = consumption;
        // Para PDBT y T1, el periodo es bimestral, así que dividimos entre 2 para obtener mensual
        result.consumption!.monthly = Math.round(consumption / 2);
        result.consumption!.average = consumption;
        console.log(`✓ Consumo detectado: ${consumption} kWh (bimestral), ${result.consumption!.monthly} kWh (mensual)`);
      }
    }
    
    // Método 2: Si no encontramos con el patrón anterior, buscar números con comas antes de palabras clave
    if (!result.consumption!.currentPeriod) {
      // Buscar secuencia de 3 números (con posibles comas) que representan lecturas
      const threeNumbersPattern = /(\d{1,3}(?:,\d{3})*)\s+(\d{1,3}(?:,\d{3})*)\s+(\d{1,3}(?:,\d{3})*)/g;
      let match;
      
      while ((match = threeNumbersPattern.exec(text)) !== null) {
        const num1 = parseInt(match[1].replace(/,/g, ''));
        const num2 = parseInt(match[2].replace(/,/g, ''));
        const num3 = parseInt(match[3].replace(/,/g, ''));
        
        // Verificar si parece ser: LecturaActual > LecturaAnterior y Consumo = diferencia
        // O simplemente si el tercer número es un consumo razonable
        if (num1 > num2 && Math.abs((num1 - num2) - num3) < 5) {
          // Es el patrón de lecturas: actual, anterior, consumo
          if (num3 > 50 && num3 < 100000) {
            result.consumption!.currentPeriod = num3;
            result.consumption!.monthly = Math.round(num3 / 2);
            result.consumption!.average = num3;
            console.log(`✓ Consumo por patrón de lecturas: ${num3} kWh`);
            break;
          }
        }
      }
    }
    
    // Método 3: Buscar todos los números que aparezcan junto a KWH
    if (!result.consumption!.currentPeriod) {
      const allKwhMatches = text.match(/\b(\d{1,5})\s*(?:KWH|kWh|kwh)/gi);
      
      if (allKwhMatches && allKwhMatches.length > 0) {
        const consumptionValues: number[] = [];
        
        for (const match of allKwhMatches) {
          const numMatch = match.match(/(\d+)/);
          if (numMatch) {
            const num = parseInt(numMatch[1]);
            if (num >= 50 && num < 50000) {
              consumptionValues.push(num);
            }
          }
        }
        
        console.log('Valores kWh encontrados:', consumptionValues);
        
        if (consumptionValues.length > 0) {
          result.consumption!.currentPeriod = consumptionValues[0];
          const avgBimonthly = consumptionValues.reduce((a, b) => a + b, 0) / consumptionValues.length;
          result.consumption!.monthly = Math.round(avgBimonthly / 2);
          result.consumption!.average = Math.round(avgBimonthly);
        }
      }
    }
    
    // Método 4: Patrones específicos de texto
    if (!result.consumption!.currentPeriod) {
      const consumptionPatterns = [
        /ENERG[IÍ]A\s*(?:CONSUMIDA)?[:\s]*(\d{1,6})\s*KWH/i,
        /CONSUMO\s*(?:DEL\s*)?(?:PERIODO|BIMESTRE|MES)?[:\s]*(\d{1,6})\s*KWH/i,
        /TOTAL\s*(?:KWH|CONSUMO)[:\s]*(\d{1,6})/i,
      ];
      
      for (const pattern of consumptionPatterns) {
        const match = text.match(pattern);
        if (match) {
          const consumption = parseInt(match[1]);
          if (consumption > 50 && consumption < 100000) {
            result.consumption!.currentPeriod = consumption;
            result.consumption!.monthly = Math.round(consumption / 2);
            break;
          }
        }
      }
    }
    
    // =====================================================
    // EXTRAER HISTORIAL DE CONSUMO
    // La tabla "CONSUMO HISTÓRICO" contiene los consumos de periodos anteriores
    // Formatos comunes:
    //   Doméstico: "del 13 DIC 23 al 12 FEB 24    313    $502.00"
    //   Industrial GDMTH: "SEP 24    203    12,475    52.63    8.54    3.7935"
    // =====================================================
    console.log('\n=== BUSCANDO HISTORIAL DE CONSUMO ===');
    
    const consumptionHistory: { period: string; kwh: number; amount: number | null }[] = [];
    const historicalAmounts: number[] = [];
    
    // Buscar la sección "CONSUMO HISTÓRICO"
    const historicoMatch = text.match(/CONSUMO\s*HIST[OÓ]RICO/i);
    if (historicoMatch && historicoMatch.index !== undefined) {
      const afterHistorico = text.substring(historicoMatch.index);
      console.log('Sección CONSUMO HISTÓRICO encontrada');
      
      // Patrón para tarifa doméstica: "del DD MES YY al DD MES YY    ###    $###.##"
      // Ejemplo: "del 13 DIC 23 al 12 FEB 24    313    $502.00    $502.00"
      const domesticPattern = /del\s+(\d{1,2}\s+[A-Z]{3}\s+\d{2})\s+al\s+(\d{1,2}\s+[A-Z]{3}\s+\d{2})\s+(\d{1,5})\s+\$?([\d,]+\.?\d*)/gi;
      let domesticMatch;
      
      while ((domesticMatch = domesticPattern.exec(afterHistorico)) !== null) {
        const periodStart = domesticMatch[1];
        const periodEnd = domesticMatch[2];
        const kwh = parseInt(domesticMatch[3]);
        const amount = parseFloat(domesticMatch[4].replace(/,/g, ''));
        
        if (kwh > 0 && kwh < 100000) {
          const period = `${periodStart} - ${periodEnd}`;
          consumptionHistory.push({ period, kwh, amount: amount || null });
          if (amount > 0) {
            historicalAmounts.push(amount);
          }
          console.log(`  Periodo doméstico: ${period}, ${kwh} kWh, $${amount}`);
        }
      }
      
      // Patrón para tarifa industrial GDMTH: "MES YY    DemandaKW    ConsumoKWH    ..."
      // Ejemplo: "SEP 24    203    12,475    52.63    8.54    3.7935"
      // La columna de consumo total kWh suele ser la tercera
      if (consumptionHistory.length === 0) {
        // Buscar patrón de meses con datos numéricos (GDMTH)
        const industrialPattern = /\b(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s*(\d{2})\s+(\d{1,4})\s+([\d,]+)\s+([\d.]+)\s+([\d.]+)/gi;
        let industrialMatch;
        
        while ((industrialMatch = industrialPattern.exec(afterHistorico)) !== null) {
          const month = industrialMatch[1];
          const year = industrialMatch[2];
          const demandKw = parseInt(industrialMatch[3]);
          const consumoKwh = parseInt(industrialMatch[4].replace(/,/g, ''));
          
          if (consumoKwh > 100 && consumoKwh < 500000) {
            const period = `${month} ${year}`;
            consumptionHistory.push({ period, kwh: consumoKwh, amount: null });
            console.log(`  Periodo industrial: ${period}, ${consumoKwh} kWh, Demanda: ${demandKw} kW`);
          }
        }
      }
      
      // Patrón alternativo para GDMTH con precio medio
      // Buscar filas con: MES YY | Demanda | Consumo | FP | FC | Precio
      if (consumptionHistory.length === 0) {
        const gdmthPattern = /\b(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s+(\d{2})\s+(\d+)\s+([\d,]+)\s+[\d.]+\s+[\d.]+\s+([\d.]+)/gi;
        let gdmthMatch;
        
        while ((gdmthMatch = gdmthPattern.exec(afterHistorico)) !== null) {
          const month = gdmthMatch[1];
          const year = gdmthMatch[2];
          const consumoKwh = parseInt(gdmthMatch[4].replace(/,/g, ''));
          const precioMedio = parseFloat(gdmthMatch[5]);
          
          if (consumoKwh > 100 && consumoKwh < 500000) {
            const period = `${month} ${year}`;
            // Calcular el costo aproximado: consumo * precio medio
            const estimatedCost = consumoKwh * precioMedio;
            consumptionHistory.push({ period, kwh: consumoKwh, amount: estimatedCost });
            historicalAmounts.push(estimatedCost);
            console.log(`  Periodo GDMTH: ${period}, ${consumoKwh} kWh, Precio medio: $${precioMedio}, Costo est: $${estimatedCost.toFixed(0)}`);
          }
        }
      }
    }
    
    // Guardar el historial en el resultado
    if (consumptionHistory.length > 0) {
      result.consumption!.history = consumptionHistory;
      result.billing!.historicalAmounts = historicalAmounts;
      
      // =====================================================
      // DETECTAR SI EL HISTORIAL ES MENSUAL O BIMESTRAL
      // =====================================================
      // Método 1: Analizar el formato del periodo
      // - Bimestral: "del DD MES YY al DD MES YY" (ej: "13 DIC 23 - 12 FEB 24")
      // - Mensual: "MES YY" (ej: "SEP 24")
      
      let isBimestral = false;
      let detectionMethod = '';
      
      // Revisar el primer periodo del historial para determinar el formato
      const firstPeriod = consumptionHistory[0]?.period || '';
      
      if (firstPeriod.includes(' - ') || firstPeriod.includes(' al ')) {
        // Formato con rango de fechas = Bimestral
        isBimestral = true;
        detectionMethod = 'formato de periodo (rango de fechas)';
      } else if (/^[A-Z]{3}\s+\d{2}$/.test(firstPeriod.trim())) {
        // Formato "MES YY" = Mensual
        isBimestral = false;
        detectionMethod = 'formato de periodo (mes único)';
      } else {
        // Método 2: Basarse en la tarifa
        // Tarifas domésticas son bimestrales, industriales son mensuales
        const domesticTariffs = ['DAC', '1', '1A', '1B', '1C', '1D', '1E', '1F', 'PDBT'];
        const industrialTariffs = ['GDMTH', 'GDMTO', 'DIST', 'DIT', 'RAMT', 'APBT', 'APMT', 'RABT'];
        
        if (result.tariff) {
          const tariffUpper = (result.tariff as string).toUpperCase();
          if (domesticTariffs.includes(tariffUpper)) {
            isBimestral = true;
            detectionMethod = 'tarifa doméstica';
          } else if (industrialTariffs.includes(tariffUpper)) {
            isBimestral = false;
            detectionMethod = 'tarifa industrial';
          }
        }
        
        // Método 3: Si hay muchos periodos (>6 en un año), probablemente es mensual
        if (!detectionMethod && consumptionHistory.length >= 10) {
          isBimestral = false;
          detectionMethod = 'cantidad de periodos (>10 = mensual)';
        } else if (!detectionMethod && consumptionHistory.length <= 6) {
          isBimestral = true;
          detectionMethod = 'cantidad de periodos (<=6 = bimestral)';
        }
      }
      
      console.log(`\n=== ANÁLISIS DE PERIODICIDAD ===`);
      console.log(`Periodos encontrados: ${consumptionHistory.length}`);
      console.log(`Ejemplo de periodo: "${firstPeriod}"`);
      console.log(`Tarifa detectada: ${result.tariff || 'No detectada'}`);
      console.log(`Tipo de facturación: ${isBimestral ? 'BIMESTRAL' : 'MENSUAL'} (detectado por: ${detectionMethod || 'default'})`);
      
      // Calcular promedio histórico de consumo
      const totalKwh = consumptionHistory.reduce((sum, h) => sum + h.kwh, 0);
      const avgKwh = Math.round(totalKwh / consumptionHistory.length);
      result.consumption!.historicalAverage = avgKwh;
      
      if (isBimestral) {
        result.consumption!.monthly = Math.round(avgKwh / 2);
        console.log(`✓ Promedio histórico por periodo: ${avgKwh} kWh (bimestral)`);
        console.log(`✓ Promedio MENSUAL calculado: ${result.consumption!.monthly} kWh`);
      } else {
        // Tarifas industriales/mensuales
        result.consumption!.monthly = avgKwh;
        console.log(`✓ Promedio MENSUAL directo: ${avgKwh} kWh`);
      }
      
      result.consumption!.average = avgKwh;
      
      // Calcular gasto promedio (también ajustar a mensual si es bimestral)
      if (historicalAmounts.length > 0) {
        const totalAmount = historicalAmounts.reduce((sum, a) => sum + a, 0);
        let avgAmount = Math.round(totalAmount / historicalAmounts.length);
        
        if (isBimestral) {
          // Si es bimestral, dividir entre 2 para obtener gasto mensual
          avgAmount = Math.round(avgAmount / 2);
          console.log(`✓ Gasto promedio por periodo: $${Math.round(totalAmount / historicalAmounts.length)} (bimestral)`);
          console.log(`✓ Gasto MENSUAL calculado: $${avgAmount}`);
        } else {
          console.log(`✓ Gasto MENSUAL directo: $${avgAmount}`);
        }
        
        result.billing!.averageAmount = avgAmount;
      }
      
      console.log(`✓ Historial cargado: ${consumptionHistory.length} periodos`);
    } else {
      console.log('⚠ No se encontró tabla de historial de consumo');
    }
    
    // =====================================================
    // EXTRAER MONTO TOTAL A PAGAR
    // =====================================================
    const amountPatterns = [
      /TOTAL\s*A\s*PAGAR[:\s]*\$?\s*([\d,]+\.?\d*)/i,
      /IMPORTE\s*(?:TOTAL)?[:\s]*\$?\s*([\d,]+\.?\d*)/i,
      /PAGAR\s*ANTES[:\s]*\$?\s*([\d,]+\.?\d*)/i,
      /ADEUDO\s*ACTUAL[:\s]*\$?\s*([\d,]+\.?\d*)/i,
    ];
    
    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        const amountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        if (amount > 50 && amount < 500000) {
          result.billing!.totalAmount = amount;
          break;
        }
      }
    }
    
    // =====================================================
    // NOTA: No extraemos nombre ni dirección del cliente
    // Estos datos los ingresa el usuario manualmente en el formulario
    // Solo extraemos ciudad y estado para pre-llenar esos campos
    // =====================================================
    
    // =====================================================
    // EXTRAER CIUDAD Y ESTADO DE LA DIRECCIÓN DEL CLIENTE
    // =====================================================
    // El formato típico es: "CIUDAD,ESTADO." o "CIUDAD, ESTADO"
    // Ejemplo: "TLAJOMULCO DE ZUNIGA,JAL."
    
    // Mapa de abreviaturas de estados a nombres completos
    const stateAbbreviations: Record<string, string> = {
      'JAL': 'Jalisco', 'JAL.': 'Jalisco',
      'NL': 'Nuevo León', 'N.L.': 'Nuevo León', 'N.L': 'Nuevo León',
      'SON': 'Sonora', 'SON.': 'Sonora',
      'BC': 'Baja California', 'B.C.': 'Baja California', 'BCN': 'Baja California',
      'BCS': 'Baja California Sur', 'B.C.S.': 'Baja California Sur',
      'CHIH': 'Chihuahua', 'CHIH.': 'Chihuahua',
      'COAH': 'Coahuila', 'COAH.': 'Coahuila',
      'DGO': 'Durango', 'DGO.': 'Durango',
      'GTO': 'Guanajuato', 'GTO.': 'Guanajuato',
      'HGO': 'Hidalgo', 'HGO.': 'Hidalgo',
      'MEX': 'Estado de México', 'MEX.': 'Estado de México', 'EDO.MEX': 'Estado de México',
      'MICH': 'Michoacán', 'MICH.': 'Michoacán',
      'MOR': 'Morelos', 'MOR.': 'Morelos',
      'NAY': 'Nayarit', 'NAY.': 'Nayarit',
      'OAX': 'Oaxaca', 'OAX.': 'Oaxaca',
      'PUE': 'Puebla', 'PUE.': 'Puebla',
      'QRO': 'Querétaro', 'QRO.': 'Querétaro',
      'QROO': 'Quintana Roo', 'Q.ROO': 'Quintana Roo', 'Q.R.': 'Quintana Roo',
      'SIN': 'Sinaloa', 'SIN.': 'Sinaloa',
      'SLP': 'San Luis Potosí', 'S.L.P.': 'San Luis Potosí',
      'TAB': 'Tabasco', 'TAB.': 'Tabasco',
      'TAMPS': 'Tamaulipas', 'TAMPS.': 'Tamaulipas', 'TAM': 'Tamaulipas',
      'TLAX': 'Tlaxcala', 'TLAX.': 'Tlaxcala',
      'VER': 'Veracruz', 'VER.': 'Veracruz',
      'YUC': 'Yucatán', 'YUC.': 'Yucatán',
      'ZAC': 'Zacatecas', 'ZAC.': 'Zacatecas',
      'AGS': 'Aguascalientes', 'AGS.': 'Aguascalientes',
      'CAMP': 'Campeche', 'CAMP.': 'Campeche',
      'CHIS': 'Chiapas', 'CHIS.': 'Chiapas',
      'COL': 'Colima', 'COL.': 'Colima',
      'CDMX': 'Ciudad de México', 'DF': 'Ciudad de México', 'D.F.': 'Ciudad de México',
      'GRO': 'Guerrero', 'GRO.': 'Guerrero'
    };
    
    // Buscar patrón: CIUDAD,ESTADO. o CIUDAD, ESTADO en la dirección
    // Patrones comunes en recibos CFE
    const locationPatterns = [
      // Patrón: CIUDAD,JAL. o CIUDAD, JAL.
      /C\.?P\.?\s*\d{5}\s+([A-ZÁÉÍÓÚÑ\s]+)[,\s]+([A-Z]{2,5}\.?)\s*(?:\n|$)/gi,
      // Patrón alternativo: buscar directamente CIUDAD,ESTADO
      /([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+(?:DE\s+[A-ZÁÉÍÓÚÑ]+)?)\s*,\s*([A-Z]{2,5}\.?)\s*(?:\n|$)/gi,
      // Patrón: después de C.P. XXXXX
      /C\.?P\.?\s*(\d{5})\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s,]+?)([A-Z]{2,5}\.?)\s*$/gim
    ];
    
    console.log('\n=== BUSCANDO UBICACIÓN ===');
    
    // Intentar extraer del patrón CIUDAD,ESTADO (como TLAJOMULCO DE ZUNIGA,JAL.)
    const cityStatePattern = /([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+(?:\s+DE\s+[A-ZÁÉÍÓÚÑ]+)?)\s*,\s*([A-Z]{2,5})\.?\s*(?:\n|$|\.)/gi;
    let cityStateMatch;
    
    while ((cityStateMatch = cityStatePattern.exec(normalizedText)) !== null) {
      const potentialCity = cityStateMatch[1].trim();
      const potentialStateAbbr = cityStateMatch[2].trim().toUpperCase();
      
      console.log(`Encontrado patrón ciudad,estado: "${potentialCity}", "${potentialStateAbbr}"`);
      
      // Verificar si la abreviatura corresponde a un estado
      const stateFullName = stateAbbreviations[potentialStateAbbr] || 
                           stateAbbreviations[potentialStateAbbr + '.'];
      
      if (stateFullName) {
        // Limpiar el nombre de la ciudad (quitar "C.P." si aparece)
        let cleanCity = potentialCity
          .replace(/C\.?P\.?\s*\d*/g, '')
          .replace(/LOMAS?\s+DE\s+[A-ZÁÉÍÓÚÑ\s]+$/i, '') // Quitar colonias
          .trim();
        
        // Si la ciudad parece válida (más de 3 caracteres)
        if (cleanCity.length > 3) {
          // Capitalizar correctamente
          result.city = cleanCity.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          result.state = stateFullName;
          console.log(`✓ Ubicación detectada: ${result.city}, ${result.state}`);
          break;
        }
      }
    }
    
    // Si no se encontró con el patrón anterior, buscar estados completos
    if (!result.state) {
      for (const state of MEXICAN_STATES) {
        const stateUpper = state.toUpperCase();
        const stateNormalized = stateUpper.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const textNormalized = normalizedText.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        if (normalizedText.includes(stateUpper) || textNormalized.includes(stateNormalized)) {
          result.state = state;
          break;
        }
      }
    }
    
    // Si encontramos ciudad pero no estado, inferir el estado
    if (result.city && !result.state) {
      const cityStateMap: Record<string, string> = {
        // Jalisco
        'Guadalajara': 'Jalisco', 'Zapopan': 'Jalisco', 'Tlaquepaque': 'Jalisco',
        'Tonalá': 'Jalisco', 'Tonala': 'Jalisco', 'Tlajomulco': 'Jalisco', 'El Salto': 'Jalisco',
        // Nuevo León
        'Monterrey': 'Nuevo León', 'San Pedro Garza': 'Nuevo León', 'Apodaca': 'Nuevo León',
        // Baja California
        'Tijuana': 'Baja California', 'Mexicali': 'Baja California', 'Ensenada': 'Baja California',
        // Sonora
        'Hermosillo': 'Sonora', 'Obregón': 'Sonora', 'Nogales': 'Sonora', 'Guaymas': 'Sonora',
        // Sinaloa
        'Culiacán': 'Sinaloa', 'Mazatlán': 'Sinaloa', 'Los Mochis': 'Sinaloa',
        // Chihuahua
        'Chihuahua': 'Chihuahua', 'Juárez': 'Chihuahua',
        // Yucatán y Quintana Roo
        'Mérida': 'Yucatán', 'Cancún': 'Quintana Roo',
        // Guanajuato y Querétaro
        'Querétaro': 'Querétaro', 'León': 'Guanajuato', 'Irapuato': 'Guanajuato', 'Celaya': 'Guanajuato',
        // Centro
        'Puebla': 'Puebla', 'Cuernavaca': 'Morelos', 'Toluca': 'Estado de México',
        'Morelia': 'Michoacán', 'Aguascalientes': 'Aguascalientes',
        // Norte
        'San Luis Potosí': 'San Luis Potosí', 'Saltillo': 'Coahuila', 'Torreón': 'Coahuila',
        'La Paz': 'Baja California Sur', 'Durango': 'Durango', 'Tepic': 'Nayarit',
        // Sur
        'Colima': 'Colima', 'Oaxaca': 'Oaxaca', 'Villahermosa': 'Tabasco',
        'Tuxtla': 'Chiapas', 'Campeche': 'Campeche', 'Veracruz': 'Veracruz',
        'Acapulco': 'Guerrero', 'Ciudad de México': 'Ciudad de México', 'CDMX': 'Ciudad de México',
      };
      result.state = cityStateMap[result.city] || null;
    }
    
    // Código postal - múltiples patrones
    const cpPatterns = [
      /C\.?P\.?\s*[:\s]*(\d{5})/i,
      /CODIGO\s*POSTAL[:\s]*(\d{5})/i,
      /\b(\d{5})\s*(?:M[EÉ]XICO|JAL|NL|CHIH|SON|BC|COAH)/i,
    ];
    
    for (const pattern of cpPatterns) {
      const cpMatch = text.match(pattern);
      if (cpMatch) {
        result.postalCode = cpMatch[1];
        break;
      }
    }
    
    // =====================================================
    // EXTRAER RMU (MEDIDOR)
    // =====================================================
    const rmuPatterns = [
      /RMU[:\s]*([A-Z0-9]{6,15})/i,
      /MEDIDOR[:\s]*([A-Z0-9]{6,15})/i,
      /NO\.\s*(?:DE\s*)?MEDIDOR[:\s]*([A-Z0-9]{6,15})/i,
    ];
    
    for (const pattern of rmuPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.rmu = match[1];
        break;
      }
    }
    
    // =====================================================
    // DATOS INDUSTRIALES (GDMTH/GDMTO)
    // =====================================================
    if (result.tariff === 'GDMTH' || result.tariff === 'GDMTO') {
      result.industrial = {
        demandKw: null,
        powerFactor: null,
        consumptionBase: null,
        consumptionIntermediate: null,
        consumptionPeak: null,
      };
      
      const demandMatch = text.match(/DEMANDA[:\s]*(\d+\.?\d*)\s*KW/i);
      if (demandMatch) {
        result.industrial.demandKw = parseFloat(demandMatch[1]);
      }
      
      const fpMatch = text.match(/FACTOR\s*(?:DE\s*)?POTENCIA[:\s]*(\d+\.?\d*)/i);
      if (fpMatch) {
        result.industrial.powerFactor = parseFloat(fpMatch[1]);
      }
      
      const baseMatch = text.match(/(?:PERIODO\s*)?BASE[:\s]*(\d+)\s*KWH/i);
      const intMatch = text.match(/(?:PERIODO\s*)?INTERMEDIO[:\s]*(\d+)\s*KWH/i);
      const peakMatch = text.match(/(?:PERIODO\s*)?PUNTA[:\s]*(\d+)\s*KWH/i);
      
      if (baseMatch) result.industrial.consumptionBase = parseInt(baseMatch[1]);
      if (intMatch) result.industrial.consumptionIntermediate = parseInt(intMatch[1]);
      if (peakMatch) result.industrial.consumptionPeak = parseInt(peakMatch[1]);
    }
    
    return result;
  }
  
  private mapTariff(tariffStr: string): CFETariff | null {
    const map: Record<string, CFETariff> = {
      // Tarifa 01 - mantener como valor separado
      '01': 'T01',
      // Otras tarifas domésticas
      '1': 'T1',
      'T1': 'T1',
      '1A': 'T1A',
      'T1A': 'T1A',
      '1B': 'T1B',
      'T1B': 'T1B',
      '1C': 'T1C',
      'T1C': 'T1C',
      '1D': 'T1D',
      'T1D': 'T1D',
      '1E': 'T1E',
      'T1E': 'T1E',
      '1F': 'T1F',
      'T1F': 'T1F',
      'DAC': 'DAC',
      'PDBT': 'PDBT',
      'GDMTO': 'GDMTO',
      'GDMTH': 'GDMTH',
    };
    
    return map[tariffStr.toUpperCase()] || null;
  }
  
  private titleCase(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
  
  /**
   * Analiza un archivo PDF de recibo CFE
   */
  async analyzeReceipt(pdfPath: string, isBase64: boolean = false): Promise<CFEReceiptData> {
    let actualPath = pdfPath;
    let tempFile: string | null = null;
    
    if (isBase64) {
      const tempDir = path.join(process.cwd(), 'uploads', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      tempFile = path.join(tempDir, `temp-${Date.now()}.pdf`);
      fs.writeFileSync(tempFile, Buffer.from(pdfPath, 'base64'));
      actualPath = tempFile;
    }
    
    try {
      if (!fs.existsSync(actualPath)) {
        throw new Error(`Archivo no encontrado: ${actualPath}`);
      }
      
      console.log('📄 Extrayendo texto del PDF...');
      
      const text = await this.extractTextFromPDF(actualPath);
      
      console.log(`✅ Texto extraído del PDF (${text.length} caracteres)`);
      
      // Log para debugging - mostrar primeros 1500 caracteres del texto
      console.log('=== TEXTO EXTRAÍDO DEL PDF ===');
      console.log(text.substring(0, 1500));
      console.log('=== FIN TEXTO ===');
      
      const parsedData = this.parseReceiptText(text);
      
      // Log de datos parseados
      console.log('=== DATOS DETECTADOS ===');
      console.log('Tarifa:', parsedData.tariff);
      console.log('Consumo:', parsedData.consumption);
      console.log('Ciudad:', parsedData.city);
      console.log('Estado:', parsedData.state);
      console.log('Monto:', parsedData.billing?.totalAmount);
      console.log('=== FIN DATOS ===');
      
      const warnings: string[] = [...(parsedData.warnings || [])];
      
      if (!parsedData.consumption?.monthly && !parsedData.consumption?.currentPeriod) {
        warnings.push('No se detectó el consumo en kWh');
      }
      if (!parsedData.tariff) {
        warnings.push('No se detectó la tarifa CFE');
      }
      if (!parsedData.billing?.totalAmount) {
        warnings.push('No se detectó el monto total');
      }
      
      // Calcular confianza basada en datos encontrados
      let confidence = 0;
      if (parsedData.serviceNumber) confidence += 20;
      if (parsedData.tariff) confidence += 25;
      if (parsedData.consumption?.monthly || parsedData.consumption?.currentPeriod) confidence += 30;
      if (parsedData.billing?.totalAmount) confidence += 15;
      if (parsedData.clientName) confidence += 10;
      
      const result: CFEReceiptData = {
        serviceNumber: parsedData.serviceNumber || null,
        rmu: parsedData.rmu || null,
        clientName: parsedData.clientName || null,
        address: parsedData.address || null,
        city: parsedData.city || null,
        state: parsedData.state || null,
        postalCode: parsedData.postalCode || null,
        tariff: parsedData.tariff || null,
        consumption: {
          currentPeriod: parsedData.consumption?.currentPeriod || null,
          previousPeriod: parsedData.consumption?.previousPeriod || null,
          average: parsedData.consumption?.average || null,
          monthly: parsedData.consumption?.monthly || null,
          history: parsedData.consumption?.history || [],
          historicalAverage: parsedData.consumption?.historicalAverage || null,
        },
        billing: {
          totalAmount: parsedData.billing?.totalAmount || null,
          periodStart: parsedData.billing?.periodStart || null,
          periodEnd: parsedData.billing?.periodEnd || null,
          dueDate: parsedData.billing?.dueDate || null,
          averageAmount: parsedData.billing?.averageAmount || null,
          historicalAmounts: parsedData.billing?.historicalAmounts || [],
        },
        confidence,
        rawText: text.substring(0, 3000),
        warnings,
      };
      
      if (parsedData.industrial) {
        result.industrial = parsedData.industrial;
      }
      
      return result;
      
    } finally {
      if (tempFile && fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  }
}

let analyzerInstance: CFEReceiptAnalyzer | null = null;

export function getCFEAnalyzer(): CFEReceiptAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new CFEReceiptAnalyzer();
  }
  return analyzerInstance;
}
