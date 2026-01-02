/**
 * SERVICIO DE GENERACIÓN DE EMAILS CON IA
 * 
 * Genera emails personalizados usando:
 * - Datos del cliente
 * - Análisis de consumo
 * - Cotización customizada
 * - Tono profesional pero amigable
 */

import logger from '../../config/logger.js';

export interface GeneratedEmail {
  subject: string;
  body: string;
  htmlBody: string;
  recipientName: string;
  recipientEmail: string;
  type: 'proposal' | 'follow_up' | 'savings_analysis' | 'urgent_action';
  metadata: {
    generatedAt: Date;
    personalizationFactors: string[];
  };
}

class EmailGeneratorService {
  /**
   * Generar email de propuesta de cotización
   */
  generateProposalEmail(data: {
    clientName: string;
    clientEmail: string;
    systemSize: number;
    monthlyConsumption: number;
    estimatedMonthlySavings: number;
    paybackMonths: number;
    roi25Years: number;
    tariffType: string;
  }): GeneratedEmail {
    const personalizationFactors: string[] = [];

    // Ajustar tono según payback
    let urgencyLevel = 'normal';
    if (data.paybackMonths < 60) {
      urgencyLevel = 'high';
      personalizationFactors.push('short_payback_period');
    } else if (data.paybackMonths > 180) {
      urgencyLevel = 'low';
      personalizationFactors.push('long_payback_period');
    }

    // Ajustar según ahorros mensuales
    let savingsLevel = 'medium';
    if (data.estimatedMonthlySavings > 2000) {
      savingsLevel = 'high';
      personalizationFactors.push('high_monthly_savings');
    } else if (data.estimatedMonthlySavings < 500) {
      savingsLevel = 'low';
      personalizationFactors.push('low_monthly_savings');
    }

    const greeting = this.generateGreeting(data.clientName);
    const bodyParagraphs = this.generateProposalParagraphs(data, savingsLevel, urgencyLevel);
    const callToAction = this.generateCTA(urgencyLevel);

    const subject = `${data.estimatedMonthlySavings.toLocaleString('es-MX', { maximumFractionDigits: 0 })}$ de ahorro mensual: tu cotización solar está lista`;

    const plainBody = `
${greeting}

${bodyParagraphs.join('\n\n')}

${callToAction.plain}

Saludos cordiales,
iAtlas Solar
Energía Solar Inteligente
www.iatlassolar.mx
`.trim();

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; }
    .content { padding: 20px 0; }
    .highlight { background: #f0f7ff; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; }
    .savings { font-size: 28px; font-weight: bold; color: #667eea; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
    .footer { font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Tu Cotización Solar está Lista! ☀️</h1>
    </div>
    
    <div class="content">
      <p>${greeting}</p>
      
      ${bodyParagraphs.map((p, i) => i === 0 ? `<div class="highlight">${p}</div>` : `<p>${p}</p>`).join('')}
      
      <div class="highlight">
        <strong>Resumen de tu Cotización:</strong><br>
        • Sistema Solar: ${data.systemSize} kW<br>
        • Ahorro Mensual: <span class="savings">$${data.estimatedMonthlySavings.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span><br>
        • Recupero de Inversión: ${data.paybackMonths} meses<br>
        • Retorno a 25 años: ${data.roi25Years.toLocaleString('es-MX', { maximumFractionDigits: 0 })}%
      </div>
      
      <p>${callToAction.html}</p>
      
      <p>Cualquier pregunta, responde a este email o llámanos.</p>
    </div>
    
    <div class="footer">
      <p><strong>iAtlas Solar</strong> - Energía Solar Inteligente</p>
      <p>www.iatlassolar.mx | Tel: +1 (123) 456-7890</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    logger.info({
      message: 'Proposal email generated',
      clientEmail: data.clientEmail,
      savingsLevel,
      urgencyLevel
    });

    return {
      subject,
      body: plainBody,
      htmlBody,
      recipientName: data.clientName,
      recipientEmail: data.clientEmail,
      type: 'proposal',
      metadata: {
        generatedAt: new Date(),
        personalizationFactors
      }
    };
  }

  /**
   * Generar email de análisis de ahorros
   */
  generateAnalysisEmail(data: {
    clientName: string;
    clientEmail: string;
    currentMonthlyBill: number;
    potentialSavings: number;
    recommendations: string[];
  }): GeneratedEmail {
    const personalizationFactors = ['consumption_analysis'];

    const greeting = this.generateGreeting(data.clientName);
    const savingsPercentage = Math.round((data.potentialSavings / data.currentMonthlyBill) * 100);

    const subject = `Análisis de tu Consumo Eléctrico: ${savingsPercentage}% de ahorro potencial`;

    const recommendationsHTML = data.recommendations
      .map(rec => `<li>${rec}</li>`)
      .join('');

    const plainBody = `
${greeting}

Hemos analizado tu consumo eléctrico actual y encontramos oportunidades de ahorro significativas.

Consumo Actual: $${data.currentMonthlyBill.toFixed(2)}/mes
Ahorro Potencial: $${data.potentialSavings.toFixed(2)}/mes (${savingsPercentage}%)

Recomendaciones:
${data.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Una solución solar podría ser tu mejor opción. ¿Conversamos?

Saludos,
iAtlas Solar
    `.trim();

    const htmlBody = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 5px;">
    <h2>Análisis de tu Consumo Eléctrico 📊</h2>
    
    <p>${greeting}</p>
    
    <p>Hemos analizado tu consumo y encontramos oportunidades de ahorro:</p>
    
    <div style="background: #f0f7ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
      <p><strong>Consumo Actual:</strong> $${data.currentMonthlyBill.toFixed(2)}/mes</p>
      <p style="font-size: 20px; color: #667eea;"><strong>Ahorro Potencial: $${data.potentialSavings.toFixed(2)}/mes (${savingsPercentage}%)</strong></p>
    </div>
    
    <h3>Nuestras Recomendaciones:</h3>
    <ul>${recommendationsHTML}</ul>
    
    <p>Un sistema solar personalizado podría transformar tu gasto en inversión.</p>
    
    <a href="#" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">Solicitar Cotización</a>
  </div>
</body>
</html>
    `.trim();

    logger.info({
      message: 'Analysis email generated',
      clientEmail: data.clientEmail,
      savingsPercentage
    });

    return {
      subject,
      body: plainBody,
      htmlBody,
      recipientName: data.clientName,
      recipientEmail: data.clientEmail,
      type: 'savings_analysis',
      metadata: {
        generatedAt: new Date(),
        personalizationFactors
      }
    };
  }

  /**
   * Generar email de seguimiento
   */
  generateFollowUpEmail(data: {
    clientName: string;
    clientEmail: string;
    daysElapsed: number;
    quotationValue: number;
  }): GeneratedEmail {
    const personalizationFactors = ['follow_up'];

    let emailType = 'gentle';
    if (data.daysElapsed > 14) emailType = 'urgent';
    if (data.daysElapsed > 30) emailType = 'final_notice';

    const greeting = this.generateGreeting(data.clientName);
    const messages: { [key: string]: { subject: string; body: string } } = {
      gentle: {
        subject: `¿Te interesa tu cotización solar?`,
        body: `Hace algunos días enviamos una cotización personalizada para tu hogar. Si tienes dudas o necesitas información adicional, aquí estamos para ayudarte.`
      },
      urgent: {
        subject: `Última oportunidad: Cotización Solar en Espera ⏰`,
        body: `Tu cotización personalizada está expirando pronto. Este análisis tomó tiempo y recursos, y representar${data.quotationValue > 5000 ? 'ía' : 'ía'} un ahorro de miles de pesos en tu factura.`
      },
      final_notice: {
        subject: `Cotización Solar - Último Llamado 🚨`,
        body: `Esta es nuestra última comunicación antes de archivar tu cotización. No queremos que pierdas esta oportunidad de ahorrar.`
      }
    };

    const message = messages[emailType];

    const plainBody = `
${greeting}

${message.body}

Si tienes preguntas o deseas activar tu sistema solar, por favor responde a este email.

Saludos,
iAtlas Solar
    `.trim();

    const htmlBody = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px;">
    <h2>${message.subject}</h2>
    
    <p>${greeting}</p>
    
    <p>${message.body}</p>
    
    ${emailType !== 'gentle' ? `
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0;">
      <strong>⏰ Acción Requerida:</strong> Responde a este email para continuar.
    </div>
    ` : ''}
    
    <p style="text-align: center; margin-top: 30px;">
      <a href="#" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">Ver Cotización</a>
    </p>
  </div>
</body>
</html>
    `.trim();

    logger.info({
      message: 'Follow-up email generated',
      clientEmail: data.clientEmail,
      emailType,
      daysElapsed: data.daysElapsed
    });

    return {
      subject: message.subject,
      body: plainBody,
      htmlBody,
      recipientName: data.clientName,
      recipientEmail: data.clientEmail,
      type: 'follow_up',
      metadata: {
        generatedAt: new Date(),
        personalizationFactors: [...personalizationFactors, emailType]
      }
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  private generateGreeting(clientName: string): string {
    const firstName = clientName.split(' ')[0];
    const greetings = [
      `Hola ${firstName},`,
      `¡Hola ${firstName}!`,
      `Estimado ${firstName},`,
      `Buenos días ${firstName},`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private generateProposalParagraphs(
    data: {
      systemSize: number;
      monthlyConsumption: number;
      estimatedMonthlySavings: number;
      paybackMonths: number;
      roi25Years: number;
      tariffType: string;
    },
    savingsLevel: string,
    urgencyLevel: string
  ): string[] {
    const paragraphs: string[] = [];

    // P1: Apertura
    const openings = {
      high: `Excelente noticia: acabamos de procesar tu solicitud y los números son muy promisores.`,
      normal: `Hemos completado el análisis de tu hogar y creamos una cotización personalizada.`,
      low: `Tu análisis de viabilidad solar está listo. Aunque el período de retorno es más largo, igualmente hay beneficios significativos.`
    };
    paragraphs.push(openings[savingsLevel as keyof typeof openings]);

    // P2: Especificaciones técnicas
    paragraphs.push(
      `Recomendamos un sistema solar de ${data.systemSize} kW, que generaría aproximadamente ${(data.systemSize * 30 * 4 * 0.85).toFixed(0)} kWh mensuales. ` +
      `Esto cubrirá la mayor parte de tu consumo actual de ${data.monthlyConsumption} kWh y te brindará estabilidad en tus gastos eléctricos.`
    );

    // P3: Beneficios económicos
    const benefit = `Tu sistema generaría ahorros de $${data.estimatedMonthlySavings.toLocaleString('es-MX', { maximumFractionDigits: 0 })} mensuales, ` +
      `lo que significa recuperar tu inversión en aproximadamente ${data.paybackMonths} meses. ` +
      `En 25 años, estaríamos hablando de un retorno de inversión del ${data.roi25Years.toLocaleString('es-MX', { maximumFractionDigits: 0 })}%.`;
    paragraphs.push(benefit);

    // P4: Call to Action versión urgencia
    const cta = {
      high: `Estos números son excepcionalmente buenos. El mercado solar está cambiando constantemente y las tarifas aumentan cada trimestre.`,
      normal: `Te invitamos a revisar esta cotización con calma.`,
      low: `Aunque toma más tiempo, la energía solar sigue siendo la inversión más inteligente para el futuro.`
    };
    paragraphs.push(cta[urgencyLevel as keyof typeof cta]);

    return paragraphs;
  }

  private generateCTA(urgencyLevel: string): { plain: string; html: string } {
    const ctas = {
      high: {
        plain: `PRÓXIMOS PASOS:\n1. Revisa tu cotización adjunta\n2. Agenda una llamada gratuita\n3. Comienza tu transición solar esta semana`,
        html: `<strong>PRÓXIMOS PASOS:</strong><ol><li>Revisa tu cotización</li><li>Agenda una llamada</li><li>Comienza esta semana</li></ol>`
      },
      normal: {
        plain: `¿Próximos pasos? Responde a este email con cualquier duda o para agendar una videollamada.`,
        html: `¿Preguntas? Responde a este email o <a href="#">agenda una llamada</a>.`
      },
      low: {
        plain: `Estamos disponibles para cualquier pregunta. Responde a este email cuando estés listo.`,
        html: `Responde en cualquier momento. Estamos aquí para ayudarte.`
      }
    };
    return ctas[urgencyLevel as keyof typeof ctas];
  }
}

export default new EmailGeneratorService();
