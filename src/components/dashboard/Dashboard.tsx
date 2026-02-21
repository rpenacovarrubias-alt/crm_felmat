// ============================================
// DASHBOARD - ESTADÍSTICAS Y RESUMEN
// ============================================

import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProperties, useLeads, useActivities } from '@/hooks/useDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Building2,
  Users,
  Eye,
  Clock,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Home,
} from 'lucide-react';

// Componente de tarjeta de estadística
interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  href?: string;
  color?: string;
}

function StatCard({ title, value, description, icon: Icon, trend, href, color = 'blue' }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  };

  const content = (
    <Card className={cn("hover:shadow-md transition-shadow", href && "cursor-pointer")}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold mt-2">{value}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.isPositive ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.value}%
                </span>
                <span className="text-sm text-muted-foreground">vs mes anterior</span>
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}

// Componente de pipeline resumido
function PipelineSummary() {
  const { leads } = useLeads();
  const { user, isAdmin } = useAuth();

  const stages = [
    { name: 'Nuevos', key: 'nuevo', color: 'bg-gray-500' },
    { name: 'Contactados', key: 'contactado', color: 'bg-blue-500' },
    { name: 'En seguimiento', key: 'en_seguimiento', color: 'bg-yellow-500' },
    { name: 'Visita programada', key: 'visita_programada', color: 'bg-purple-500' },
    { name: 'Negociación', key: 'negociacion', color: 'bg-orange-500' },
    { name: 'Cerrados', key: 'cerrado_ganado', color: 'bg-green-500' },
  ];

  // Filtrar leads según permisos
  const filteredLeads = isAdmin 
    ? leads 
    : leads.filter(l => l.assignedTo === user?.id);

  const getCountByStage = (stage: string) => 
    filteredLeads.filter(l => l.status === stage).length;

  const total = filteredLeads.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Pipeline de Ventas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage) => {
            const count = getCountByStage(stage.key);
            const percentage = total > 0 ? (count / total) * 100 : 0;
            
            return (
              <div key={stage.key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                    {stage.name}
                  </span>
                  <span className="font-medium">{count}</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total leads</span>
          <span className="text-xl font-bold">{total}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de propiedades destacadas
function FeaturedProperties() {
  const { properties } = useProperties();
  const { user, canViewAllProperties } = useAuth();

  // Filtrar propiedades según permisos
  const filteredProperties = canViewAllProperties
    ? properties
    : properties.filter(p => p.agentId === user?.id);

  const featuredProperties = filteredProperties
    .filter(p => p.isFeatured || p.isPublished)
    .slice(0, 4);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Propiedades Destacadas
        </CardTitle>
        <Link to="/properties">
          <Button variant="ghost" size="sm">Ver todas</Button>
        </Link>
      </CardHeader>
      <CardContent>
        {featuredProperties.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No hay propiedades destacadas</p>
            <Link to="/properties/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Agregar propiedad
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {featuredProperties.map((property) => (
              <Link 
                key={property.id} 
                to={`/properties/${property.id}`}
                className="group block"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  {property.images[0] ? (
                    <img
                      src={property.images[0].url}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {property.isFeatured && (
                      <Badge className="bg-yellow-500">Destacada</Badge>
                    )}
                    <Badge variant={property.status === 'disponible' ? 'default' : 'secondary'}>
                      {property.status}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="font-medium text-sm truncate">{property.title}</p>
                  <p className="text-lg font-bold text-primary">
                    ${property.price.toLocaleString()} {property.priceCurrency}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Eye className="w-3 h-3" />
                    {property.views} vistas
                    <span className="mx-1">•</span>
                    <Users className="w-3 h-3" />
                    {property.leadsCount} leads
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente de leads recientes
function RecentLeads() {
  const { leads } = useLeads();
  const { user, isAdmin } = useAuth();

  // Filtrar leads según permisos
  const filteredLeads = isAdmin 
    ? leads 
    : leads.filter(l => l.assignedTo === user?.id);

  const recentLeads = filteredLeads
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'nuevo': 'bg-gray-500',
      'contactado': 'bg-blue-500',
      'calificado': 'bg-yellow-500',
      'en_seguimiento': 'bg-orange-500',
      'visita_programada': 'bg-purple-500',
      'cerrado_ganado': 'bg-green-500',
      'cerrado_perdido': 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Leads Recientes
        </CardTitle>
        <Link to="/leads">
          <Button variant="ghost" size="sm">Ver todos</Button>
        </Link>
      </CardHeader>
      <CardContent>
        {recentLeads.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No hay leads recientes
          </p>
        ) : (
          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <Link 
                key={lead.id} 
                to={`/leads/${lead.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {lead.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">{lead.email}</p>
                </div>
                <div className="text-right">
                  <Badge className={getStatusBadge(lead.status)}>
                    {lead.status.replace('_', ' ')}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(lead.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Dashboard principal
export function Dashboard() {
  const { user, isAdmin, canViewAllProperties } = useAuth();
  const { properties } = useProperties();
  const { leads } = useLeads();
  const { activities } = useActivities();

  // Filtrar datos según permisos
  const filteredProperties = canViewAllProperties
    ? properties
    : properties.filter(p => p.agentId === user?.id);

  const filteredLeads = isAdmin 
    ? leads 
    : leads.filter(l => l.assignedTo === user?.id);

  const filteredActivities = isAdmin 
    ? activities 
    : activities.filter(a => a.assignedTo === user?.id);

  // Calcular estadísticas
  const totalProperties = filteredProperties.length;
  const publishedProperties = filteredProperties.filter(p => p.isPublished).length;
  const totalLeads = filteredLeads.length;
  const newLeadsThisMonth = filteredLeads.filter(l => {
    const created = new Date(l.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;
  const pendingActivities = filteredActivities.filter(a => a.status === 'pendiente').length;
  const totalViews = filteredProperties.reduce((sum, p) => sum + p.views, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            ¡Hola, {user?.name}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin 
              ? 'Este es el resumen de tu inmobiliaria' 
              : 'Este es el resumen de tu actividad'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/properties/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Propiedad
            </Button>
          </Link>
          <Link to="/leads/new">
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Nuevo Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Propiedades"
          value={totalProperties}
          description={`${publishedProperties} publicadas`}
          icon={Building2}
          href="/properties"
          color="blue"
        />
        <StatCard
          title="Leads"
          value={totalLeads}
          description={`${newLeadsThisMonth} nuevos este mes`}
          icon={Users}
          href="/leads"
          color="purple"
        />
        <StatCard
          title="Vistas Totales"
          value={totalViews.toLocaleString()}
          description="De todas tus propiedades"
          icon={Eye}
          color="green"
        />
        <StatCard
          title="Actividades Pendientes"
          value={pendingActivities}
          description="Tareas por completar"
          icon={Clock}
          href="/activities"
          color="orange"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <FeaturedProperties />
          <RecentLeads />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <PipelineSummary />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
