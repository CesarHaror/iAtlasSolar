// =====================================================
// APP PRINCIPAL - ENRUTAMIENTO
// =====================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useIsAuthenticated } from '@/stores/authStore';

// Layouts
import MainLayout from '@/layouts/MainLayout';

// Pages
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import { ClientsPage, ClientFormPage, ClientDetailPage } from '@/pages/clients';
import { QuotationsPage, NewQuotationPage, QuotationDetailPage, EditQuotationPage } from '@/pages/quotations';
import { ProformasListPage, ProformaDetailPage } from '@/pages/proformas';
import { ProjectsListPage, ProjectDetailPage } from '@/pages/projects';
import CatalogPage from '@/pages/catalog/CatalogPage';
import ConfigPage from '@/pages/config/ConfigPage';

// Components
import ProtectedRoute from '@/components/ProtectedRoute';

// Placeholder pages (se implementarán después)
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="card">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
    <p className="text-gray-600">Esta página se implementará próximamente.</p>
  </div>
);

function App() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta de login */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          }
        />

        {/* Rutas protegidas con layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Redirect root to dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard */}
          <Route path="dashboard" element={<DashboardPage />} />
          
          {/* Cotizaciones */}
          <Route path="quotations" element={<QuotationsPage />} />
          <Route path="quotations/new" element={<NewQuotationPage />} />
          <Route path="quotations/:id" element={<QuotationDetailPage />} />
          <Route path="quotations/:id/edit" element={<EditQuotationPage />} />
          
          {/* Clientes */}
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/new" element={<ClientFormPage />} />
          <Route path="clients/:id" element={<ClientDetailPage />} />
          <Route path="clients/:id/edit" element={<ClientFormPage />} />
          
          {/* Proformas */}
          <Route path="proformas" element={<ProformasListPage />} />
          <Route path="proformas/:id" element={<ProformaDetailPage />} />
          
          {/* Proyectos */}
          <Route path="projects" element={<ProjectsListPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          
          {/* Catálogo */}
          <Route path="catalog" element={<CatalogPage />} />
          
          {/* Configuración */}
          <Route path="settings" element={<ConfigPage />} />
          
          {/* Perfil */}
          <Route path="profile" element={<PlaceholderPage title="Mi Perfil" />} />
          
          {/* Reportes */}
          <Route path="reports" element={<PlaceholderPage title="Reportes" />} />
        </Route>

        {/* 404 - Ruta no encontrada */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-300">404</h1>
                <p className="text-xl text-gray-600 mt-4">Página no encontrada</p>
                <a
                  href="/dashboard"
                  className="btn-primary mt-6 inline-block"
                >
                  Volver al inicio
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
