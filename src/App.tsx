import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import MainLayout from '@/components/layout/MainLayout';
import { AuthProvider } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useDatabaseInit } from '@/hooks/useDatabase';

// Lazy loading de páginas
const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/components/dashboard/Dashboard'));
const PropertyList = lazy(() => import('@/components/properties/PropertyList'));
const PropertyForm = lazy(() => import('@/components/properties/PropertyForm'));
const PropertyDetail = lazy(() => import('@/components/properties/PropertyDetail'));
const EstimacionesPage = lazy(() => import('@/components/estimaciones/EstimacionesPage'));
const PropertyPerformance = lazy(() => import('@/components/properties/PropertyPerformance'));
const SharedLists = lazy(() => import('@/components/lists/SharedLists'));
const PublicList = lazy(() => import('@/components/lists/PublicList'));
const LeadList = lazy(() => import('@/components/leads/LeadList'));
const LeadForm = lazy(() => import('@/components/leads/LeadForm'));
const Calendar = lazy(() => import('@/pages/Calendar'));
const Website = lazy(() => import('@/components/website/WebsiteBuilder'));
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
        <Route path="/lista/:slug" element={<PublicList />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Properties */}
            <Route path="/propiedades" element={<PropertyList />} />
            <Route path="/propiedades/nueva" element={<PropertyForm />} />
            <Route path="/propiedades/tipos" element={<ModulePlaceholder title="Tipos de Propiedades" />} />
            <Route path="/propiedades/amenidades" element={<ModulePlaceholder title="Amenidades" />} />
            <Route path="/propiedades/desempeno" element={<PropertyPerformance />} />
            <Route path="/propiedades/:id" element={<PropertyDetail />} />
            <Route path="/propiedades/:id/edit" element={<PropertyForm />} />
            <Route path="/estimaciones" element={<EstimacionesPage />} />
            <Route path="/vinculaciones" element={<ModulePlaceholder title="Vinculaciones" />} />
            <Route path="/listas-compartidas" element={<SharedLists />} />
            
            {/* Leads */}
            <Route path="/leads" element={<LeadList />} />
            <Route path="/leads/new" element={<LeadForm />} />
            <Route path="/leads/importar" element={<ModulePlaceholder title="Importar Leads" />} />
            <Route path="/leads/:id" element={<LeadForm />} />
            <Route path="/leads/:id/edit" element={<LeadForm />} />
            
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
            
            {/* Anuncios */}
            <Route path="/anuncios" element={<Anuncios />} />
            <Route path="/anuncios/nuevo" element={<ModulePlaceholder title="Nuevo Anuncio" />} />
            <Route path="/anuncios/:id" element={<ModulePlaceholder title="Detalle de Anuncio" />} />
            <Route path="/anuncios/:id/editar" element={<ModulePlaceholder title="Editar Anuncio" />} />
            
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
            <Route path="/airbnb/anuncios/nuevo" element={<ModulePlaceholder title="Nuevo Anuncio Airbnb" />} />
            <Route path="/airbnb/anuncios/:id" element={<ModulePlaceholder title="Detalle Anuncio Airbnb" />} />
            <Route path="/airbnb/anuncios/:id/editar" element={<ModulePlaceholder title="Editar Anuncio Airbnb" />} />
            <Route path="/airbnb/calendario" element={<ModulePlaceholder title="Calendario Airbnb" />} />
            <Route path="/airbnb/precios" element={<ModulePlaceholder title="Precios Dinámicos" />} />
            <Route path="/airbnb/mensajes" element={<ModulePlaceholder title="Mensajes Airbnb" />} />
            <Route path="/airbnb/reservas" element={<ModulePlaceholder title="Reservas Airbnb" />} />
            
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
  const { isReady, error } = useDatabaseInit();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center px-4">
        <p className="text-muted-foreground">No se pudo iniciar la base de datos local. Intenta recargar la página.</p>
      </div>
    );
  }

  if (!isReady) {
    return <PageLoader />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
