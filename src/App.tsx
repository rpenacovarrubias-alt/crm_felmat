// ============================================
// APP PRINCIPAL - RUTAS DEL CRM CON PERMISOS
// ============================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { PropertyList } from '@/components/properties/PropertyList';
import { PropertyForm } from '@/components/properties/PropertyForm';
import { PropertyDetail } from '@/components/properties/PropertyDetail';
import { PublicPropertyPage } from '@/components/properties/PublicPropertyPage';
import { LeadList } from '@/components/leads/LeadList';
import { LeadForm } from '@/components/leads/LeadForm';
import { WebsiteBuilder } from '@/components/website/WebsiteBuilder';
import { WebhookConfig } from '@/components/settings/WebhookConfig';
import { UserManagement } from '@/components/users/UserManagement';
import { VisitCalendar } from '@/components/calendar/VisitCalendar';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { CartaPresentacion } from '@/components/carta/CartaPresentacion';
import AnunciosAdminPage from '@/pages/admin/condominios/anuncios';
import AnunciosAirbnbPage from '@/pages/airbnb/anuncios';
import { Cotizaciones } from '@/components/cotizaciones/Cotizaciones';
import { useDatabaseInit } from '@/hooks/useDatabase';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

// Componente de protección de rutas (autenticación)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Componente de protección de rutas (solo admin)
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
        <p className="text-muted-foreground mb-4 text-center">
          No tienes permisos para acceder a esta sección.
        </p>
        <a href="/" className="text-primary hover:underline">Volver al inicio</a>
      </div>
    );
  }
  
  return <>{children}</>;
}

// Inicializador de base de datos
function DatabaseInitializer({ children }: { children: React.ReactNode }) {
  const { isReady, error } = useDatabaseInit();
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error de inicialización</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }
  
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  
  return <>{children}</>;
}

// Placeholder para módulos en desarrollo
function ModulePlaceholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="text-center py-16">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <p className="text-muted-foreground">{description || 'Módulo en desarrollo'}</p>
    </div>
  );
}

// App principal
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/p/:slug" element={<PublicPropertyPage />} />
      
      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<Dashboard />} />
        
        {/* Properties - Inventario */}
        <Route path="properties" element={<PropertyList />} />
        <Route path="properties/new" element={<PropertyForm />} />
        <Route path="properties/:id" element={<PropertyDetail />} />
        <Route path="properties/:id/edit" element={<PropertyForm />} />
        
        {/* Properties - Submenús (placeholders por ahora) */}
        <Route 
          path="estimations" 
          element={<EstimacionForm />} 
        />
        <Route 
          path="links" 
          element={<ModulePlaceholder title="Vinculaciones" description="Bolsa de propiedades entre agentes" />} 
        />
        <Route 
          path="shared-lists" 
          element={<ModulePlaceholder title="Listas Compartidas" description="Propiedades compartidas con otros agentes" />} 
        />
        <Route 
          path="performance" 
          element={<ModulePlaceholder title="Desempeño" description="Métricas de rendimiento por agente" />} 
        />
        
        {/* Leads */}
        <Route path="leads" element={<LeadList />} />
        <Route path="leads/new" element={<LeadForm />} />
        <Route path="leads/:id" element={<LeadForm />} />
        <Route path="leads/:id/edit" element={<LeadForm />} />
        
        {/* Calendar */}
        <Route path="calendar" element={<VisitCalendar />} />
        
        {/* Website */}
        <Route path="website" element={<WebsiteBuilder />} />
        
        {/* Activities */}
        <Route 
          path="activities" 
          element={<ModulePlaceholder title="Actividades" description="Tareas y seguimientos pendientes" />} 
        />
        
        {/* Notifications */}
        <Route path="notifications" element={<NotificationCenter />} />
        
        {/* Settings */}
        <Route path="settings" element={<WebhookConfig />} />
        
        {/* Profile */}
        <Route 
          path="profile" 
          element={<ModulePlaceholder title="Perfil" description="Configuración de tu perfil" />} 
        />
        
        {/* Admin Routes */}
        <Route 
          path="users" 
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          } 
        />
        <Route 
          path="analytics" 
          element={
            <AdminRoute>
              <ModulePlaceholder title="Estadísticas" description="Reportes y análisis del sistema" />
            </AdminRoute>
          } 
        />
        
        {/* NUEVOS MENÚS */}
        
        {/* Administración de Condominios */}
        <Route 
          path="admin/condominios/anuncios" 
          element={<AnunciosAdminPage />} 
        />
        
        {/* Carta Presentación */}
        <Route path="carta-presentacion" element={<CartaPresentacion />} />
        
        {/* Cotizaciones */}
        <Route path="cotizaciones" element={<Cotizaciones />} />
        
        {/* Anuncios */}
        <Route 
          path="anuncios" 
          element={<AnunciosAirbnbPage />} 
        />
        
        {/* Legal */}
        <Route 
          path="legal/compra-venta" 
          element={<ModulePlaceholder title="Contrato de Compra-Venta" description="Generador de contratos de compra-venta" />} 
        />
        <Route 
          path="legal/arrendamiento" 
          element={<ModulePlaceholder title="Contrato de Arrendamiento" description="Generador de contratos de arrendamiento" />} 
        />
        <Route 
          path="legal/reglamento-casa" 
          element={<ModulePlaceholder title="Reglamento de Casa" description="Reglamento interno de casas" />} 
        />
        <Route 
          path="legal/reglamento-condominio" 
          element={<ModulePlaceholder title="Reglamento de Condominio" description="Reglamento de condominios y propiedades horizontales" />} 
        />
        
        {/* AIRBNB */}
        <Route 
          path="airbnb/anuncio" 
          element={<ModulePlaceholder title="Anuncio AIRBNB" description="Gestión de anuncios en AIRBNB" />} 
        />
        <Route 
          path="airbnb/propiedades" 
          element={<ModulePlaceholder title="Propiedades AIRBNB" description="Inventario de propiedades para AIRBNB" />} 
        />
        <Route 
          path="airbnb/fichas" 
          element={<ModulePlaceholder title="Fichas Técnicas AIRBNB" description="Fichas técnicas de propiedades AIRBNB" />} 
        />
        <Route 
          path="airbnb/administracion" 
          element={<ModulePlaceholder title="Administración AIRBNB" description="Panel de administración de propiedades AIRBNB" />} 
        />
        <Route 
          path="airbnb/comision" 
          element={<ModulePlaceholder title="Comisión AIRBNB" description="Cálculo de comisiones AIRBNB" />} 
        />
        <Route 
          path="airbnb/limpieza" 
          element={<ModulePlaceholder title="Limpieza AIRBNB" description="Gestión de servicios de limpieza" />} 
        />
        
        {/* Reportes */}
        <Route 
          path="reportes/ingresos-propiedad" 
          element={<ModulePlaceholder title="Ingresos por Propiedad" description="Reporte detallado de ingresos por cada propiedad" />} 
        />
        <Route 
          path="reportes/ingresos-generales" 
          element={<ModulePlaceholder title="Ingresos Generales" description="Reporte consolidado de ingresos totales" />} 
        />
      </Route>
      
      {/* 404 */}
      <Route 
        path="*" 
        element={
          <div className="min-h-screen flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-muted-foreground mb-4">Página no encontrada</p>
            <a href="/" className="text-primary hover:underline">Volver al inicio</a>
          </div>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <DatabaseInitializer>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" />
        </BrowserRouter>
      </DatabaseInitializer>
    </AuthProvider>
  );
}

export default App;
