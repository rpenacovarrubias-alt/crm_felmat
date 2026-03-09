import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/sonner';
import MainLayout from '@/components/layout/MainLayout';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Lazy loading de páginas
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Properties = lazy(() => import('@/pages/Properties'));
const Leads = lazy(() => import('@/pages/Leads'));
const LeadDetails = lazy(() => import('@/pages/LeadDetails'));
const Calendar = lazy(() => import('@/pages/Calendar'));
const Website = lazy(() => import('@/pages/Website'));
const Activities = lazy(() => import('@/pages/Activities'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Settings = lazy(() => import('@/pages/Settings'));
const Profile = lazy(() => import('@/pages/Profile'));
const Users = lazy(() => import('@/pages/Users'));
const Anuncios = lazy(() => import('@/components/anuncios/Anuncios'));

// Placeholder simple para módulos en desarrollo
function ModulePlaceholder({ title, description }: { title: string; description?: string }) {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <p className="text-muted-foreground">{description || 'Módulo en desarrollo'}</p>
    </div>
  );
}

// Loading component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Properties */}
            <Route path="/propiedades" element={<Properties />} />
            <Route path="/propiedades/nueva" element={<ModulePlaceholder title="Nueva Propiedad" />} />
            <Route path="/propiedades/tipos" element={<ModulePlaceholder title="Tipos de Propiedades" />} />
            <Route path="/propiedades/amenidades" element={<ModulePlaceholder title="Amenidades" />} />
            
            {/* Leads */}
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/nuevo" element={<LeadDetails />} />
            <Route path="/leads/:id" element={<LeadDetails />} />
            <Route path="/leads/importar" element={<ModulePlaceholder title="Importar Leads" />} />
            
            {/* Calendar */}
            <Route path="/calendario" element={<Calendar />} />
            
            {/* Website */}
            <Route path="/sitio-web" element={<Website />} />
            
            {/* Activities */}
            <Route path="/actividades" element={<Activities />} />
            
            {/* Notifications */}
            <Route path="/notificaciones" element={<Notifications />} />
            
            {/* Settings */}
            <Route path="/configuracion" element={<Settings />} />
            
            {/* Profile */}
            <Route path="/perfil" element={<Profile />} />
            
            {/* Admin */}
            <Route path="/admin/usuarios" element={<Users />} />
            
            {/* NUEVOS MENÚS - Funcionando */}
            <Route path="/anuncios" element={<Anuncios />} />
            
            {/* Condominios */}
            <Route path="/admin/condominios" element={<ModulePlaceholder title="Administración de Condominios" />} />
            <Route path="/admin/condominios/nuevo" element={<ModulePlaceholder title="Nuevo Condominio" />} />
            
            {/* Carta Presentación */}
            <Route path="/carta-presentacion" element={<ModulePlaceholder title="Carta de Presentación" />} />
            
            {/* Cotizaciones */}
            <Route path="/cotizaciones" element={<ModulePlaceholder title="Cotizaciones" />} />
            <Route path="/cotizaciones/nueva" element={<ModulePlaceholder title="Nueva Cotización" />} />
            
            {/* Legal */}
            <Route path="/legal/contratos" element={<ModulePlaceholder title="Contratos" />} />
            <Route path="/legal/contratos/nuevo" element={<ModulePlaceholder title="Nuevo Contrato" />} />
            <Route path="/legal/fianzas" element={<ModulePlaceholder title="Fianzas" />} />
            <Route path="/legal/fianzas/nueva" element={<ModulePlaceholder title="Nueva Fianza" />} />
            
            {/* Airbnb */}
            <Route path="/airbnb/anuncios" element={<Anuncios />} />
            <Route path="/airbnb/calendario" element={<ModulePlaceholder title="Calendario Airbnb" />} />
            <Route path="/airbnb/precios" element={<ModulePlaceholder title="Precios Dinámicos" />} />
            <Route path="/airbnb/mensajes" element={<ModulePlaceholder title="Mensajes" />} />
            <Route path="/airbnb/reservas" element={<ModulePlaceholder title="Reservas" />} />
            
            {/* Reportes */}
            <Route path="/reportes/ventas" element={<ModulePlaceholder title="Reportes de Ventas" />} />
            <Route path="/reportes/leads" element={<ModulePlaceholder title="Reportes de Leads" />} />
            
            {/* 404 */}
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-4xl font-bold mb-4">404</h1>
                <p className="text-muted-foreground mb-4">Página no encontrada</p>
                <a href="/dashboard" className="text-primary hover:underline">Volver al inicio</a>
              </div>
            } />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
