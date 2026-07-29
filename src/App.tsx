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
const TarjetaDigitalPage = lazy(() => import('@/components/tarjeta-digital/TarjetaDigitalPage'));
const AgentCard = lazy(() => import('@/components/tarjeta-digital/AgentCard'));
const PublicWebsite = lazy(() => import('@/components/website/PublicWebsite'));
const BolsaPage = lazy(() => import('@/components/bolsa/BolsaPage'));
const LeadList = lazy(() => import('@/components/leads/LeadList'));
const LeadForm = lazy(() => import('@/components/leads/LeadForm'));
const ImportarLeadsPage = lazy(() => import('@/components/leads/ImportarLeadsPage'));
const Calendar = lazy(() => import('@/components/calendar/VisitCalendar'));
const Website = lazy(() => import('@/components/website/WebsiteBuilder'));
const Activities = lazy(() => import('@/components/activities/ActivitiesList'));
const Notifications = lazy(() => import('@/components/notifications/NotificationCenter'));
const Settings = lazy(() => import('@/pages/Settings'));
const Profile = lazy(() => import('@/components/profile/ProfilePage'));
const Users = lazy(() => import('@/components/users/UserManagement'));
const Anuncios = lazy(() => import('@/components/anuncios/Anuncios'));
const AnuncioForm = lazy(() => import('@/components/anuncios/AnuncioForm'));
const AnuncioDetail = lazy(() => import('@/components/anuncios/AnuncioDetail'));
const CondominiosPage = lazy(() => import('@/components/condominios/CondominiosPage'));
const CotizacionesList = lazy(() => import('@/components/cotizaciones/CotizacionesList'));
const CotizacionForm = lazy(() => import('@/components/cotizaciones/CotizacionForm'));
const CartaPresentacionPage = lazy(() => import('@/components/carta-presentacion/CartaPresentacionPage'));
const ContratosList = lazy(() => import('@/components/legal/ContratosList'));
const ContratoForm = lazy(() => import('@/components/legal/ContratoForm'));
const FianzasPage = lazy(() => import('@/components/legal/FianzasPage'));
const AirbnbCalendarioPage = lazy(() => import('@/components/airbnb/AirbnbCalendarioPage'));
const AirbnbPreciosPage = lazy(() => import('@/components/airbnb/AirbnbPreciosPage'));
const AirbnbMensajesPage = lazy(() => import('@/components/airbnb/AirbnbMensajesPage'));
const AirbnbReservasPage = lazy(() => import('@/components/airbnb/AirbnbReservasPage'));
const ReportesVentasPage = lazy(() => import('@/components/reportes/ReportesVentasPage'));
const ReportesLeadsPage = lazy(() => import('@/components/reportes/ReportesLeadsPage'));
const TiposPropiedadPage = lazy(() => import('@/components/propiedades/TiposPropiedadPage'));
const AmenidadesPage = lazy(() => import('@/components/propiedades/AmenidadesPage'));
const PublicPropertyPage = lazy(() => import('@/components/properties/PublicPropertyPage'));
const VinculacionesPage = lazy(() => import('@/components/vinculaciones/VinculacionesPage'));

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
        <Route path="/p/:slug" element={<PublicPropertyPage />} />
        <Route path="/p/:id" element={<PublicPropertyPage />} />
        <Route path="/propiedades/publica/:id" element={<PublicPropertyPage />} />
        <Route path="/lista/:slug" element={<PublicList />} />
        <Route path="/agente/:slug" element={<AgentCard />} />
        <Route path="/sitio/:subdomain" element={<PublicWebsite />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Properties */}
            <Route path="/propiedades" element={<PropertyList />} />
            <Route path="/propiedades/nueva" element={<PropertyForm />} />
            <Route path="/propiedades/tipos" element={<TiposPropiedadPage />} />
            <Route path="/propiedades/amenidades" element={<AmenidadesPage />} />
            <Route path="/propiedades/desempeno" element={<PropertyPerformance />} />
            <Route path="/propiedades/:id" element={<PropertyDetail />} />
            <Route path="/propiedades/:id/edit" element={<PropertyForm />} />
            <Route path="/estimaciones" element={<EstimacionesPage />} />
            <Route path="/vinculaciones" element={<VinculacionesPage />} />
            <Route path="/listas-compartidas" element={<SharedLists />} />
            <Route path="/tarjeta-digital" element={<TarjetaDigitalPage />} />
            <Route path="/bolsa" element={<BolsaPage />} />
            
            {/* Leads */}
            <Route path="/leads" element={<LeadList />} />
            <Route path="/leads/new" element={<LeadForm />} />
            <Route path="/leads/importar" element={<ImportarLeadsPage />} />
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
            <Route path="/anuncios/nuevo" element={<AnuncioForm />} />
            <Route path="/anuncios/:id" element={<AnuncioDetail />} />
            <Route path="/anuncios/:id/editar" element={<AnuncioForm />} />
            
            {/* Condominios */}
            <Route path="/admin/condominios" element={<CondominiosPage />} />
            <Route path="/admin/condominios/nuevo" element={<Navigate to="/admin/condominios" replace />} />
            
            {/* Carta Presentación */}
            <Route path="/carta-presentacion" element={<CartaPresentacionPage />} />
            
            {/* Cotizaciones */}
            <Route path="/cotizaciones" element={<CotizacionesList />} />
            <Route path="/cotizaciones/nueva" element={<CotizacionForm />} />
            <Route path="/cotizaciones/:id" element={<CotizacionForm />} />
            
            {/* Legal */}
            <Route path="/legal/contratos" element={<ContratosList />} />
            <Route path="/legal/contratos/nuevo" element={<ContratoForm />} />
            <Route path="/legal/contratos/:id" element={<ContratoForm />} />
            <Route path="/legal/fianzas" element={<FianzasPage />} />
            <Route path="/legal/fianzas/nueva" element={<Navigate to="/legal/fianzas" replace />} />
            
            {/* Airbnb */}
            <Route path="/airbnb/anuncios" element={<Anuncios />} />
            <Route path="/airbnb/anuncios/nuevo" element={<AnuncioForm />} />
            <Route path="/airbnb/anuncios/:id" element={<AnuncioDetail />} />
            <Route path="/airbnb/anuncios/:id/editar" element={<AnuncioForm />} />
            <Route path="/airbnb/calendario" element={<AirbnbCalendarioPage />} />
            <Route path="/airbnb/precios" element={<AirbnbPreciosPage />} />
            <Route path="/airbnb/mensajes" element={<AirbnbMensajesPage />} />
            <Route path="/airbnb/reservas" element={<AirbnbReservasPage />} />
            
            {/* Reportes */}
            <Route path="/reportes/ventas" element={<ReportesVentasPage />} />
            <Route path="/reportes/leads" element={<ReportesLeadsPage />} />
            
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
