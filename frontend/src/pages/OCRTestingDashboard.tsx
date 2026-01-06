/**
 * OCR TESTING DASHBOARD
 * 
 * Componente principal para visualizar y gestionar tests de OCR
 * - Ver resultados históricos
 * - Gráficos de accuracy
 * - Métricas agregadas
 * - Upload de recibos para testing
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

interface TestResult {
  testId: string;
  fileName: string;
  overallAccuracy: number;
  fieldResults: Record<string, any>;
  createdAt: string;
  processingTime: number;
}

interface Metrics {
  totalTests: number;
  avgAccuracy: number;
  minAccuracy: number;
  maxAccuracy: number;
  avgProcessingTime: number;
  fieldMetrics: Record<string, number>;
}

interface Batch {
  batchId: string;
  name: string;
  totalTests: number;
  processedCount: number;
  avgAccuracy: number;
  status: string;
  createdAt: string;
}

const OCRTestingDashboard: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'upload' | 'batches'>('overview');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTruth, setUploadTruth] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Colores para gráficos
  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  // Obtener métricas
  useEffect(() => {
    fetchMetrics();
    fetchResults();
    fetchBatches();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/testing/database/metrics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics(response.data.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar métricas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/testing/database/results?limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(response.data.data.results);
    } catch (err) {
      console.error('Error fetching results:', err);
    }
  };

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/testing/database/batches?limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBatches(response.data.data.batches);
    } catch (err) {
      console.error('Error fetching batches:', err);
    }
  };

  // Realizar test
  const handleUploadTest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadFile || !uploadTruth) {
      alert('Por favor selecciona ambos archivos');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('groundTruth', uploadTruth);

      const response = await axios.post('/api/testing/ocr/validate-single', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Actualizar resultados
      fetchMetrics();
      fetchResults();
      
      // Limpiar
      setUploadFile(null);
      setUploadTruth(null);
      
      alert(`✅ Test completado! Accuracy: ${response.data.data.validation.overallAccuracy}%`);
    } catch (err) {
      alert('Error al procesar test');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Renderizar pestaña Overview
  const renderOverview = () => {
    if (!metrics) return <div className="text-center py-8">Cargando...</div>;

    // Preparar datos para gráfico de accuracy por campo
    const fieldData = Object.entries(metrics.fieldMetrics).map(([field, accuracy]) => ({
      name: field,
      accuracy: Math.round(accuracy * 100) / 100
    }));

    // Color según accuracy
    const accuracyColor = metrics.avgAccuracy >= 92 ? 'text-green-600' : 
                         metrics.avgAccuracy >= 85 ? 'text-yellow-600' : 'text-red-600';

    return (
      <div className="space-y-6">
        {/* Tarjetas de métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total de Tests</div>
            <div className="text-3xl font-bold text-blue-600">{metrics.totalTests}</div>
          </div>

          <div className={`bg-white rounded-lg shadow p-6`}>
            <div className="text-sm text-gray-600 mb-2">Accuracy Promedio</div>
            <div className={`text-3xl font-bold ${accuracyColor}`}>
              {Math.round(metrics.avgAccuracy * 100) / 100}%
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Tiempo Promedio</div>
            <div className="text-3xl font-bold text-purple-600">
              {metrics.avgProcessingTime}ms
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Rango Accuracy</div>
            <div className="text-sm text-gray-700">
              <div>Min: {Math.round(metrics.minAccuracy * 100) / 100}%</div>
              <div>Max: {Math.round(metrics.maxAccuracy * 100) / 100}%</div>
            </div>
          </div>
        </div>

        {/* Gráfico de accuracy por campo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Accuracy por Campo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fieldData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value: any) => `${value}%`} />
              <Bar dataKey="accuracy" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Información de decisión */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <h4 className="font-semibold text-blue-900 mb-2">📊 Estado de Validación</h4>
          {metrics.avgAccuracy >= 92 ? (
            <p className="text-green-700">
              ✅ <strong>GO:</strong> Accuracy {metrics.avgAccuracy}% &gt;= 92%. Listo para proceder con FASE 1.
            </p>
          ) : metrics.avgAccuracy >= 85 ? (
            <p className="text-yellow-700">
              ⚠️ <strong>CONDITIONAL:</strong> Accuracy {metrics.avgAccuracy}% está entre 85-92%. Considera mejorar OCR.
            </p>
          ) : (
            <p className="text-red-700">
              ❌ <strong>NO-GO:</strong> Accuracy {metrics.avgAccuracy}% &lt; 85%. Se requiere revisión.
            </p>
          )}
        </div>
      </div>
    );
  };

  // Renderizar pestaña de Resultados
  const renderResults = () => {
    if (results.length === 0) {
      return <div className="text-center py-8 text-gray-500">Sin resultados aún</div>;
    }

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Test ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Archivo</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Accuracy</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tiempo (ms)</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {results.map((result) => (
              <tr key={result.testId} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono text-gray-600">{result.testId.slice(0, 12)}...</td>
                <td className="px-6 py-4 text-sm text-gray-700">{result.fileName}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-block px-3 py-1 rounded-full text-white text-sm ${
                    result.overallAccuracy >= 90 ? 'bg-green-500' :
                    result.overallAccuracy >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    {Math.round(result.overallAccuracy * 100) / 100}%
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{result.processingTime}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(result.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderizar pestaña de Upload
  const renderUpload = () => {
    return (
      <div className="bg-white rounded-lg shadow p-8 max-w-2xl">
        <h3 className="text-xl font-semibold mb-6">Realizar Test OCR</h3>
        
        <form onSubmit={handleUploadTest} className="space-y-6">
          {/* Upload del recibo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recibo (PDF o Imagen)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {uploadFile && (
              <p className="mt-2 text-sm text-green-600">✓ {uploadFile.name}</p>
            )}
          </div>

          {/* Upload del ground truth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ground Truth (JSON)
            </label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setUploadTruth(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {uploadTruth && (
              <p className="mt-2 text-sm text-green-600">✓ {uploadTruth.name}</p>
            )}
          </div>

          {/* Información */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-900">
              <strong>Ground Truth JSON:</strong> Archivo con los valores correctos del recibo
            </p>
            <p className="text-xs text-blue-800 mt-2">
              Ejemplo: {"{"}"serviceNumber": "123456789012", "consumptionKWh": 245{"}"}
            </p>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={uploading || !uploadFile || !uploadTruth}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold
              hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed
              transition-colors"
          >
            {uploading ? 'Procesando...' : 'Ejecutar Test'}
          </button>
        </form>
      </div>
    );
  };

  // Renderizar pestaña de Batches
  const renderBatches = () => {
    if (batches.length === 0) {
      return <div className="text-center py-8 text-gray-500">Sin batches aún</div>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {batches.map((batch) => (
          <div key={batch.batchId} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{batch.name}</h3>
                <p className="text-sm text-gray-500">{batch.batchId.slice(0, 12)}...</p>
              </div>
              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                batch.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                batch.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {batch.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tests Procesados:</span>
                <span className="font-semibold">{batch.processedCount}/{batch.totalTests}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Accuracy Promedio:</span>
                <span className="font-semibold text-blue-600">{Math.round(batch.avgAccuracy * 100) / 100}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fecha:</span>
                <span className="text-gray-600">{new Date(batch.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(batch.processedCount / batch.totalTests) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🧪 OCR Testing Dashboard
          </h1>
          <p className="text-gray-600">FASE 4 - Validación de Precisión OCR</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeTab === 'results'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📈 Resultados
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            ⬆️ Upload
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeTab === 'batches'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📦 Batches
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Contenido */}
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'results' && renderResults()}
          {activeTab === 'upload' && renderUpload()}
          {activeTab === 'batches' && renderBatches()}
        </div>
      </div>
    </div>
  );
};

export default OCRTestingDashboard;
