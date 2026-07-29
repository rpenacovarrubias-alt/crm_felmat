import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const propMatch = location.pathname.match(/^\/propiedades\/([^\/]+)$/);
    if (propMatch && !['nueva', 'tipos', 'amenidades', 'desempeno'].includes(propMatch[1])) {
      return <Navigate to={`/p/${propMatch[1]}`} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
