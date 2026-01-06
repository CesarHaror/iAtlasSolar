import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface ProjectionMonth {
  month: number;
  monthName: string;
  withPanels: {
    gridConsumption: number;
    solarProduction: number;
    netConsumption: number;
    costMXN: number;
  };
  withoutPanels: {
    gridConsumption: number;
    costMXN: number;
  };
  savingsMXN: number;
  savingsPercent: number;
}

interface ConsumptionProjectionChartsProps {
  projections: ProjectionMonth[];
  totalSavings12Months: number;
  systemSizeKW: number;
}

export function ConsumptionProjectionCharts({
  projections,
  totalSavings12Months,
  systemSizeKW,
}: ConsumptionProjectionChartsProps) {
  // Transformar datos para los charts
  const chartData = projections.map((p) => ({
    month: p.monthName.substring(0, 3), // "Enero" -> "Ene"
    withPanels: Math.round(p.withPanels.gridConsumption),
    withoutPanels: Math.round(p.withoutPanels.gridConsumption),
    costWithPanels: Math.round(p.withPanels.costMXN),
    costWithoutPanels: Math.round(p.withoutPanels.costMXN),
  }));

  return (
    <div className="space-y-8">
      {/* CHART 1: PROYECCIÓN CON PANELES (Consumo + Costo) */}
      <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-600">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-bold text-gray-900">
            ☀️ CON Paneles Solares (12 meses)
          </h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Consumo bajo y costo mínimo. Tu inversión comienza a recuperarse.
        </p>

        <div className="h-80 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 80, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" style={{ fontSize: '11px' }} />
              <YAxis yAxisId="left" stroke="#16a34a" label={{ value: 'kWh', angle: -90, position: 'insideLeft', offset: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#059669" label={{ value: 'MXN', angle: 90, position: 'insideRight', offset: 10 }} />
              <Tooltip formatter={(value: any) => {
                if (typeof value === 'number' && value > 500) return `$${(value as number).toFixed(0)}`;
                return `${(value as number).toFixed(0)}`;
              }} />
              
              <Bar yAxisId="left" dataKey="withPanels" fill="#10b981" radius={[6, 6, 0, 0]} name="Consumo (kWh)" />
              <Line 
                yAxisId="right"
                type="natural" 
                dataKey="costWithPanels" 
                stroke="#059669" 
                strokeWidth={4}
                dot={false}
                name="Costo (MXN)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 p-3 rounded border border-green-200">
            <p className="text-xs text-gray-600 uppercase font-semibold">Consumo Prom.</p>
            <p className="text-xl font-bold text-green-600">{Math.round(chartData.reduce((sum, d) => sum + d.withPanels, 0) / chartData.length)} kWh</p>
          </div>
          <div className="bg-green-50 p-3 rounded border border-green-200">
            <p className="text-xs text-gray-600 uppercase font-semibold">Gasto Prom.</p>
            <p className="text-xl font-bold text-green-600">${Math.round(chartData.reduce((sum, d) => sum + d.costWithPanels, 0) / chartData.length).toLocaleString('es-MX')}</p>
          </div>
        </div>
      </div>

      {/* CHART 2: PROYECCIÓN SIN PANELES (Consumo + Costo) */}
      <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-600">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-6 h-6 text-red-600" />
          <h3 className="text-xl font-bold text-gray-900">
            📈 SIN Paneles Solares (12 meses)
          </h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Consumo creciente y factura incrementándose continuamente.
        </p>

        <div className="h-80 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 80, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" style={{ fontSize: '11px' }} />
              <YAxis yAxisId="left" stroke="#dc2626" label={{ value: 'kWh', angle: -90, position: 'insideLeft', offset: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#b91c1c" label={{ value: 'MXN', angle: 90, position: 'insideRight', offset: 10 }} />
              <Tooltip formatter={(value: any) => {
                if (typeof value === 'number' && value > 500) return `$${(value as number).toFixed(0)}`;
                return `${(value as number).toFixed(0)}`;
              }} />
              
              <Bar yAxisId="left" dataKey="withoutPanels" fill="#ef4444" radius={[6, 6, 0, 0]} name="Consumo (kWh)" />
              <Line 
                yAxisId="right"
                type="natural" 
                dataKey="costWithoutPanels" 
                stroke="#b91c1c" 
                strokeWidth={4}
                dot={false}
                name="Costo (MXN)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 p-3 rounded border border-red-200">
            <p className="text-xs text-gray-600 uppercase font-semibold">Consumo Prom.</p>
            <p className="text-xl font-bold text-red-600">{Math.round(chartData.reduce((sum, d) => sum + d.withoutPanels, 0) / chartData.length)} kWh</p>
          </div>
          <div className="bg-red-50 p-3 rounded border border-red-200">
            <p className="text-xs text-gray-600 uppercase font-semibold">Gasto Prom.</p>
            <p className="text-xl font-bold text-red-600">${Math.round(chartData.reduce((sum, d) => sum + d.costWithoutPanels, 0) / chartData.length).toLocaleString('es-MX')}</p>
          </div>
        </div>
      </div>

      {/* RESUMEN COMPARATIVO */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Comparativa a Largo Plazo</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-red-200">
            <p className="text-xs text-gray-600 uppercase font-semibold">Sin Paneles</p>
            <p className="text-2xl font-bold text-red-600 mt-2">Incremento</p>
            <p className="text-sm text-gray-700 mt-1">Consumo: ↗️ Crecimiento gradual</p>
            <p className="text-sm text-gray-700">Costo: ↗️ Continua aumentando</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-200">
            <p className="text-xs text-gray-600 uppercase font-semibold">Con {systemSizeKW.toFixed(2)} kW</p>
            <p className="text-2xl font-bold text-green-600 mt-2">Estabilidad</p>
            <p className="text-sm text-gray-700 mt-1">Consumo: ➡️ Controlado y bajo</p>
            <p className="text-sm text-gray-700">Costo: ➡️ Mínimo y estable</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600 uppercase font-semibold">Diferencia en 12 meses</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              ${totalSavings12Months.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-gray-700 mt-1">Ahorro del primer año</p>
            <p className="text-xs text-blue-600 font-semibold mt-2">Este dinero ya comenzó a recuperar tu inversión 💰</p>
          </div>
        </div>
      </div>
    </div>
  );
}
